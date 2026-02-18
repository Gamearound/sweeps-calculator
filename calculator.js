/**
 * Calculator Logic
 * Handles distribution of players (Pyramid/Linear) and prizes (Geometric/Linear)
 * Ensures mathematically strictly descending values.
 */

const TIER_NAMES = ["Diamond", "Platinum", "Gold", "Silver", "Bronze"];

const Calculator = {
    compute: (cfg) => {
        // 1. Validation
        if (cfg.prize <= 0 || cfg.players <= 0) {
            return { error: "Please enter a valid Prize Pool and Player count." };
        }

        // 2. Determine Total Winners
        // If fixed, use value. If percent, calc percent of players.
        let totalWinners = cfg.winnerMode === 'percent'
            ? Math.floor(cfg.players * (cfg.winnersVal / 100))
            : Math.floor(cfg.winnersVal);

        // Safety Clamp: Winners cannot exceed Players, must be at least 1
        totalWinners = Math.max(1, Math.min(totalWinners, cfg.players));

        // 3. Active Tiers
        // Cannot have more tiers than winners (e.g., 3 winners can't fill 5 tiers)
        let numTiers = Math.min(cfg.tiersRequested, totalWinners);

        // 4. Initialize Structure
        const tiers = [];
        for (let i = 0; i < numTiers; i++) {
            tiers.push({ name: TIER_NAMES[i], count: 0, weight: 0, payout: 0 });
        }

        // ==========================================
        // 5. PLAYER DISTRIBUTION (Guaranteed Minimum)
        // ==========================================

        // Rule: Every tier must have at least 1 player.
        for (let i = 0; i < numTiers; i++) {
            tiers[i].count = 1;
        }

        // Distribute remaining winners
        let winnersRemaining = totalWinners - numTiers;

        if (winnersRemaining > 0) {
            let playerWeights = [];
            let totalW = 0;

            for (let i = 0; i < numTiers; i++) {
                let w = 1;
                // Pyramid Logic: Tier 0 (Dia) = 1, Tier 1 (Plat) = Mult...
                if (cfg.playerStyle === 'linear') {
                    w = i + 1; // 1, 2, 3...
                } else if (cfg.playerStyle === 'multiplier') {
                    w = Math.pow(cfg.playerMult, i); // 1, 2, 4...
                }
                playerWeights.push({ idx: i, w: w });
                totalW += w;
            }

            // Largest Remainder Method
            let currentAssigned = 0;
            playerWeights.forEach(item => {
                item.ideal = (item.w / totalW) * winnersRemaining;
                item.assigned = Math.floor(item.ideal);
                item.remainder = item.ideal - item.assigned;

                tiers[item.idx].count += item.assigned; // Add to existing 1
                currentAssigned += item.assigned;
            });

            // Distribute fractions to largest remainders
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
            // Descending Logic: Top tier gets highest weight per player
            if (cfg.prizeStyle === 'linear') {
                w = numTiers - i; // 5, 4, 3...
            } else if (cfg.prizeStyle === 'multiplier') {
                // Geometric: Diamond = Mult^(N-1)... Bronze = 1
                w = Math.pow(cfg.prizeMult, numTiers - 1 - i);
            }

            t.weight = w;
            // Total shares = Players * Weight Per Player
            totalShares += (t.count * w);
        });

        // Calculate Value (in Pence)
        const totalPence = Math.round(cfg.prize * 100);

        if (totalShares <= 0) return { error: "Calculation Error: 0 Shares" };

        const pencePerShare = Math.floor(totalPence / totalShares);
        let distributedPence = 0;

        tiers.forEach(t => {
            // Payout per player = Share Value * Player Weight
            const payPerPlayer = Math.floor(pencePerShare * t.weight);
            t.payout = payPerPlayer / 100; // Convert to float for display
            distributedPence += (payPerPlayer * t.count);
        });

        const remainder = totalPence - distributedPence;

        return {
            prize: cfg.prize,
            players: cfg.players,
            totalWinners,
            tiers,
            leftover: remainder // In pence
        };
    }
};