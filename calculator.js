/**
 * Calculator Logic
 * Handles distribution of players and prizes
 */

// Helper function to dynamically assign tier names based on how many tiers are active
const getTierNames = (numTiers) => {
    if (numTiers === 1) return ["Gold"];
    if (numTiers === 2) return ["Gold", "Silver"];
    if (numTiers === 3) return ["Gold", "Silver", "Bronze"];
    if (numTiers === 4) return ["Platinum", "Gold", "Silver", "Bronze"];
    return ["Diamond", "Platinum", "Gold", "Silver", "Bronze"]; // 5 Tiers
};

const Calculator = {
    compute: (cfg) => {
        // 1. Validation
        if (cfg.prize <= 0 || cfg.players <= 0) {
            return { error: "Please enter a valid Prize Pool and Player count." };
        }

        // 2. Determine Total Winners
        // UPDATED: Using Math.round() so 10% of 34 (3.4) = 3, and 10% of 29 (2.9) = 3.
        let totalWinners = cfg.winnerMode === 'percent'
            ? Math.round(cfg.players * (cfg.winnersVal / 100))
            : Math.floor(cfg.winnersVal);

        // Safety Clamp: Winners cannot exceed Players, must be at least 1
        totalWinners = Math.max(1, Math.min(totalWinners, cfg.players));

        // 3. Active Tiers
        let numTiers = Math.min(cfg.tiersRequested, totalWinners);

        // 4. Initialize Structure
        const tiers = [];
        const currentTierNames = getTierNames(numTiers); // UPDATED: Get dynamic names

        for (let i = 0; i < numTiers; i++) {
            tiers.push({ name: currentTierNames[i], count: 0, weight: 0, payout: 0 });
        }

        // ==========================================
        // 5. PLAYER DISTRIBUTION (Guaranteed Minimum)
        // ==========================================
        for (let i = 0; i < numTiers; i++) {
            tiers[i].count = 1;
        }

        let winnersRemaining = totalWinners - numTiers;

        if (winnersRemaining > 0) {
            let playerWeights = [];
            let totalW = 0;

            for (let i = 0; i < numTiers; i++) {
                let w = 1;
                if (cfg.playerStyle === 'linear') {
                    w = i + 1;
                } else if (cfg.playerStyle === 'multiplier') {
                    w = Math.pow(cfg.playerMult, i);
                }
                playerWeights.push({ idx: i, w: w });
                totalW += w;
            }

            let currentAssigned = 0;
            playerWeights.forEach(item => {
                item.ideal = (item.w / totalW) * winnersRemaining;
                item.assigned = Math.floor(item.ideal);
                item.remainder = item.ideal - item.assigned;

                tiers[item.idx].count += item.assigned;
                currentAssigned += item.assigned;
            });

            playerWeights.sort((a, b) => b.remainder - a.remainder);
            let left = winnersRemaining - currentAssigned;
            for(let i=0; i<left; i++) {
                tiers[playerWeights[i].idx].count++;
            }
        }

        // ==========================================
        // 6. PRIZE DISTRIBUTION (Descending Value)
        // ==========================================
        let totalShares = 0;

        tiers.forEach((t, i) => {
            let w = 1;
            if (cfg.prizeStyle === 'linear') {
                w = numTiers - i;
            } else if (cfg.prizeStyle === 'multiplier') {
                w = Math.pow(cfg.prizeMult, numTiers - 1 - i);
            }

            t.weight = w;
            totalShares += (t.count * w);
        });

        const totalPence = Math.round(cfg.prize * 100);

        if (totalShares <= 0) return { error: "Calculation Error: 0 Shares" };

        const pencePerShare = Math.floor(totalPence / totalShares);
        let distributedPence = 0;

        tiers.forEach(t => {
            const payPerPlayer = Math.floor(pencePerShare * t.weight);
            t.payout = payPerPlayer / 100;
            distributedPence += (payPerPlayer * t.count);
        });

        const remainder = totalPence - distributedPence;

        return {
            prize: cfg.prize,
            players: cfg.players,
            totalWinners,
            tiers,
            leftover: remainder
        };
    }
};