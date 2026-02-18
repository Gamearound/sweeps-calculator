/**
 * UI Controller
 * Manages DOM events, visibility toggles, and rendering.
 */
const UI = {
    init: () => {
        // Toggle Visibility for Multiplier Inputs
        const updateConfigUI = () => {
            const pStyle = document.getElementById('prizeDistStyle').value;
            const plStyle = document.getElementById('playerDistStyle').value;
            const pMult = document.getElementById('prizeDistMult');
            const plMult = document.getElementById('playerDistMult');

            // Show/Hide inputs
            pMult.style.display = (pStyle === 'multiplier') ? 'block' : 'none';
            plMult.style.display = (plStyle === 'multiplier') ? 'block' : 'none';

            // Update Helper Text
            const help = document.getElementById('strategyHelp');
            if (pStyle === 'multiplier' && plStyle === 'multiplier') {
                help.innerHTML = `<strong>Multiplier:</strong> Tier 1 pays <strong>${pMult.value}x</strong> more than Tier 2.<br>Tier 2 has <strong>${plMult.value}x</strong> more players than Tier 1.`;
            } else if (pStyle === 'linear' || plStyle === 'linear') {
                help.innerHTML = `<strong>Linear:</strong> Values increase/decrease by a fixed step (e.g. 1, 2, 3, 4).`;
            } else if (pStyle === 'equal' && plStyle === 'equal') {
                help.innerHTML = `<strong>Equal:</strong> Every tier gets the same prize and player count (where possible).`;
            } else {
                help.innerHTML = `Custom strategy selected.`;
            }
        };

        // Attach listeners to config inputs
        ['prizeDistStyle', 'playerDistStyle', 'prizeDistMult', 'playerDistMult'].forEach(id => {
            document.getElementById(id).addEventListener('input', updateConfigUI);
        });

        // Initial run
        updateConfigUI();

        // Calculate Button
        document.getElementById('calcBtn').addEventListener('click', UI.handleCalculate);

        // Copy Button
        document.getElementById('copyBtn').addEventListener('click', UI.copyToClipboard);
    },

    getInputs: () => ({
        prize: parseFloat(document.getElementById('totalPrize').value) || 0,
        players: parseInt(document.getElementById('totalPlayers').value) || 0,
        winnersVal: parseFloat(document.getElementById('winnersVal').value) || 0,
        winnerMode: document.getElementById('winnerMode').value,
        tiersRequested: parseInt(document.getElementById('tierCount').value),

        prizeStyle: document.getElementById('prizeDistStyle').value,
        prizeMult: parseFloat(document.getElementById('prizeDistMult').value) || 1,
        playerStyle: document.getElementById('playerDistStyle').value,
        playerMult: parseFloat(document.getElementById('playerDistMult').value) || 1
    }),

    handleCalculate: () => {
        const inputs = UI.getInputs();
        const result = Calculator.compute(inputs);

        if (result.error) {
            UI.renderError(result.error);
        } else {
            UI.renderResults(result);
        }
    },

    renderError: (msg) => {
        const box = document.getElementById('errorBox');
        box.style.display = 'block';
        box.innerText = msg;
        document.getElementById('result-area').style.display = 'none';
    },

    renderResults: (data) => {
        document.getElementById('errorBox').style.display = 'none';
        document.getElementById('result-area').style.display = 'block';

        // Summary
        const fmt = (val) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);
        document.getElementById('res-total').innerText = fmt(data.prize);
        document.getElementById('res-sub').innerText = `${data.totalWinners} Winners / ${data.players} Players`;

        // Table
        const tbody = document.getElementById('res-table-body');
        tbody.innerHTML = '';

        data.tiers.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="tier-badge tier-${t.name}">${t.name}</span></td>
                <td class="text-right">${t.count}</td>
                <td class="text-right font-mono">${fmt(t.payout)}</td>
                <td class="text-right font-mono" style="font-weight:700">${fmt(t.payout * t.count)}</td>
            `;
            tbody.appendChild(tr);
        });

        // Leftover
        if (data.leftover > 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td colspan="3" style="font-size:0.85rem; color:#64748b; padding-left:10px; font-style:italic;">
                    Unassigned Pennies (Rounding)
                </td>
                <td class="text-right font-mono" style="font-size:0.85rem; color:#64748b;">
                    ${(data.leftover/100).toFixed(2)}
                </td>
            `;
            tbody.appendChild(tr);
        }

        // Store text for copy button
        UI.lastResultText = UI.generateCopyText(data);
    },

    generateCopyText: (data) => {
        const fmt = (val) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);
        let txt = `🏆 PRIZE DISTRIBUTION\n`;
        txt += `Pool: ${fmt(data.prize)} | Winners: ${data.totalWinners}\n\n`;

        data.tiers.forEach(t => {
            if(t.count > 0) {
                txt += `${t.name}: ${t.count}x @ ${fmt(t.payout)}\n`;
            }
        });
        return txt;
    },

    copyToClipboard: () => {
        if (!UI.lastResultText) return;
        navigator.clipboard.writeText(UI.lastResultText).then(() => {
            const btn = document.getElementById('copyBtn');
            const original = btn.innerText;
            btn.innerText = "Copied!";
            btn.style.background = "#10b981"; // Green
            btn.style.color = "white";
            setTimeout(() => {
                btn.innerText = original;
                btn.style.background = "transparent";
                btn.style.color = "#64748b";
            }, 2000);
        });
    }
};

document.addEventListener('DOMContentLoaded', UI.init);