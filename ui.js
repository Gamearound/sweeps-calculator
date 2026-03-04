/**
 * Bracket Rulesets (Editable by user via Tabs)
 */
let BRACKETS = [
    { id: 1, min: 0, max: 9, winnersVal: 1, winnerMode: "fixed", tiers: 1, prizeStyle: "multiplier", prizeMult: 1, playerStyle: "multiplier", playerMult: 1 },
    { id: 2, min: 10, max: 25, winnersVal: 3, winnerMode: "fixed", tiers: 3, prizeStyle: "multiplier", prizeMult: 2.0, playerStyle: "multiplier", playerMult: 2.0 },
    { id: 3, min: 26, max: 99, winnersVal: 10, winnerMode: "percent", tiers: 5, prizeStyle: "multiplier", prizeMult: 2.0, playerStyle: "multiplier", playerMult: 2.0 },
    { id: 4, min: 100, max: "", winnersVal: 10, winnerMode: "percent", tiers: 5, prizeStyle: "multiplier", prizeMult: 2.0, playerStyle: "multiplier", playerMult: 2.0 }
];

const UI = {
    activeTabIndex: 0, // Defaults to first tab

    init: () => {
        UI.renderTabs();
        UI.loadTabToForm(0);

        // Listen for user typing in any tab input to save it
        document.querySelectorAll('.tab-input').forEach(input => {
            input.addEventListener('input', () => {
                UI.saveFormToTab();
                UI.updateConfigUI();
            });
        });

        // Auto-switch tabs when Total Players changes
        document.getElementById('totalPlayers').addEventListener('input', UI.autoSwitchTab);

        document.getElementById('calcBtn').addEventListener('click', UI.handleCalculate);
        document.getElementById('copyBtn').addEventListener('click', UI.copyToClipboard);
    },

    // 1. TABS MANAGEMENT
    renderTabs: () => {
        const header = document.getElementById('tabsHeader');
        header.innerHTML = '';

        BRACKETS.forEach((b, index) => {
            const btn = document.createElement('button');
            const maxLabel = b.max === "" || b.max === Infinity ? "100+" : b.max;
            btn.innerText = `${b.min} - ${maxLabel}`;
            btn.className = `tab-btn ${index === UI.activeTabIndex ? 'active' : ''}`;

            btn.addEventListener('click', () => {
                UI.activeTabIndex = index;
                UI.renderTabs(); // Update active class
                UI.loadTabToForm(index);
            });

            header.appendChild(btn);
        });
    },

    loadTabToForm: (index) => {
        const b = BRACKETS[index];
        document.getElementById('bracketMin').value = b.min;
        document.getElementById('bracketMax').value = b.max;
        document.getElementById('winnersVal').value = b.winnersVal;
        document.getElementById('winnerMode').value = b.winnerMode;
        document.getElementById('tierCount').value = b.tiers;
        document.getElementById('prizeDistStyle').value = b.prizeStyle;
        document.getElementById('prizeDistMult').value = b.prizeMult;
        document.getElementById('playerDistStyle').value = b.playerStyle;
        document.getElementById('playerDistMult').value = b.playerMult;

        UI.updateConfigUI();
    },

    saveFormToTab: () => {
        const b = BRACKETS[UI.activeTabIndex];
        b.min = parseInt(document.getElementById('bracketMin').value) || 0;

        const maxInput = document.getElementById('bracketMax').value;
        b.max = maxInput === "" ? "" : parseInt(maxInput);

        b.winnersVal = parseFloat(document.getElementById('winnersVal').value) || 0;
        b.winnerMode = document.getElementById('winnerMode').value;
        b.tiers = parseInt(document.getElementById('tierCount').value);
        b.prizeStyle = document.getElementById('prizeDistStyle').value;
        b.prizeMult = parseFloat(document.getElementById('prizeDistMult').value) || 1;
        b.playerStyle = document.getElementById('playerDistStyle').value;
        b.playerMult = parseFloat(document.getElementById('playerDistMult').value) || 1;

        // Update the tab button names in case min/max changed
        const activeBtn = document.getElementById('tabsHeader').children[UI.activeTabIndex];
        const maxLabel = b.max === "" || b.max === Infinity ? "100+" : b.max;
        activeBtn.innerText = `${b.min} - ${maxLabel}`;
    },

    autoSwitchTab: (e) => {
        const players = parseInt(e.target.value) || 0;

        // Find which bracket this player count falls into
        const newTabIdx = BRACKETS.findIndex(b => {
            const maxVal = (b.max === "" || b.max === Infinity) ? Infinity : b.max;
            return players >= b.min && players <= maxVal;
        });

        if (newTabIdx !== -1 && newTabIdx !== UI.activeTabIndex) {
            UI.activeTabIndex = newTabIdx;
            UI.renderTabs();
            UI.loadTabToForm(newTabIdx);
        }
    },

    updateConfigUI: () => {
        const pStyle = document.getElementById('prizeDistStyle').value;
        const plStyle = document.getElementById('playerDistStyle').value;
        const pMult = document.getElementById('prizeDistMult');
        const plMult = document.getElementById('playerDistMult');

        pMult.style.display = (pStyle === 'multiplier') ? 'block' : 'none';
        plMult.style.display = (plStyle === 'multiplier') ? 'block' : 'none';

        const help = document.getElementById('strategyHelp');
        if (pStyle === 'multiplier' && plStyle === 'multiplier') {
            help.innerHTML = `Multiplier Mode: Tier 1 gets ${pMult.value}x prize, Tier 2 has ${plMult.value}x players.`;
        } else {
            help.innerHTML = `Linear Mode: Values increase by fixed steps.`;
        }
    },

    // 2. CALCULATOR EXECUTION
    handleCalculate: () => {
        const players = parseInt(document.getElementById('totalPlayers').value) || 0;
        const prize = parseFloat(document.getElementById('totalPrize').value) || 0;

        if (players <= 0 || prize <= 0) {
            UI.renderError("Please enter a valid Prize Pool and Current Players count at the top.");
            return;
        }

        // Find the correct bracket index based on Current Players
        const correctBracketIndex = BRACKETS.findIndex(b => {
            const maxVal = (b.max === "" || b.max === Infinity) ? Infinity : b.max;
            return players >= b.min && players <= maxVal;
        });

        if (correctBracketIndex === -1) {
            UI.renderError("No ruleset bracket found for this amount of players. Please adjust your Min/Max settings.");
            return;
        }

        // *** THE FIX: Auto-switch UI to the calculated tab if they navigated away ***
        if (UI.activeTabIndex !== correctBracketIndex) {
            UI.activeTabIndex = correctBracketIndex;
            UI.renderTabs();
            UI.loadTabToForm(correctBracketIndex);
        }

        const correctBracket = BRACKETS[correctBracketIndex];

        // Send rules to the calculator engine
        const inputs = {
            prize: prize,
            players: players,
            winnersVal: correctBracket.winnersVal,
            winnerMode: correctBracket.winnerMode,
            tiersRequested: correctBracket.tiers,
            prizeStyle: correctBracket.prizeStyle,
            prizeMult: correctBracket.prizeMult,
            playerStyle: correctBracket.playerStyle,
            playerMult: correctBracket.playerMult
        };

        const result = Calculator.compute(inputs);

        if (result.error) {
            UI.renderError(result.error);
        } else {
            UI.renderResults(result);
        }
    },

    // 3. RENDER RESULTS
    renderError: (msg) => {
        const box = document.getElementById('errorBox');
        box.style.display = 'block';
        box.innerText = msg;
        document.getElementById('result-area').style.display = 'none';
    },

    renderResults: (data) => {
        document.getElementById('errorBox').style.display = 'none';
        document.getElementById('result-area').style.display = 'block';

        const fmt = (val) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);
        document.getElementById('res-total').innerText = fmt(data.prize);
        document.getElementById('res-sub').innerText = `${data.totalWinners} Winners / ${data.players} Players`;

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

        UI.lastResultText = UI.generateCopyText(data);
    },

    generateCopyText: (data) => {
        const fmt = (val) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);
        let txt = `🏆 PRIZE DISTRIBUTION\n`;
        txt += `Pool: ${fmt(data.prize)} | Winners: ${data.totalWinners}\n\n`;
        data.tiers.forEach(t => { if(t.count > 0) txt += `${t.name}: ${t.count}x @ ${fmt(t.payout)}\n`; });
        return txt;
    },

    copyToClipboard: () => {
        if (!UI.lastResultText) return;
        navigator.clipboard.writeText(UI.lastResultText).then(() => {
            const btn = document.getElementById('copyBtn');
            const original = btn.innerText;
            btn.innerText = "Copied!";
            btn.style.background = "#10b981"; btn.style.color = "white";
            setTimeout(() => {
                btn.innerText = original;
                btn.style.background = "transparent"; btn.style.color = "#64748b";
            }, 2000);
        });
    }
};

document.addEventListener('DOMContentLoaded', UI.init);