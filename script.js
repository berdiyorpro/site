const API_KEY = "efe5f5f05934af2e167c0529c75588ef";
const API_HOST = "v3.football.api-sports.io";

let currentTab = 'matches';

// Tablarni almashtirish mantiqi
function changeTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    
    const filters = document.getElementById('match-filters');
    if(tab === 'matches') {
        filters.classList.remove('hidden');
        fetchMatches('today');
    } else {
        filters.classList.add('hidden');
        if(tab === 'standings') fetchStandings(39); // EPL ligasi misolida
        if(tab === 'scorers') fetchTopScorers(39); 
    }
}

// 1. O'YINLARNI OLISH
async function fetchMatches(mode) {
    const container = document.getElementById('content-area');
    container.innerHTML = '<div class="text-center py-20 animate-pulse text-gray-500">Ma\'lumotlar yangilanmoqda...</div>';

    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`btn-${mode}`);
    if(btn) btn.classList.add('active');

    let dateStr = new Date().toISOString().split('T')[0];
    if (mode === 'tomorrow') {
        let tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateStr = tomorrow.toISOString().split('T')[0];
    }

    let url = mode === 'live' ? `https://${API_HOST}/fixtures?live=all` : `https://${API_HOST}/fixtures?date=${dateStr}`;

    try {
        const response = await fetch(url, { headers: { "x-rapidapi-key": API_KEY, "x-rapidapi-host": API_HOST }});
        const data = await response.json();
        renderMatches(data.response);
    } catch (err) {
        container.innerHTML = '<p class="text-red-500 text-center">API ulanishda xato!</p>';
    }
}

function renderMatches(matches) {
    const container = document.getElementById('content-area');
    container.innerHTML = '';

    if (!matches || matches.length === 0) {
        container.innerHTML = '<p class="text-center py-20 text-gray-600 italic">Hozirda o\'yinlar topilmadi.</p>';
        return;
    }

    const grouped = matches.reduce((acc, m) => {
        const name = m.league.name;
        if (!acc[name]) acc[name] = { logo: m.league.logo, games: [] };
        acc[name].games.push(m);
        return acc;
    }, {});

    for (let league in grouped) {
        let section = `<div class="league-card mb-6">
            <div class="bg-[#0d1117] p-3 text-[11px] font-bold text-[#00ff85] flex items-center gap-2 border-b border-gray-800">
                <img src="${grouped[league].logo}" class="w-4 h-4"> ${league.toUpperCase()}
            </div>`;

        grouped[league].games.forEach(m => {
            const time = new Date(m.fixture.date).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
            const isLive = m.fixture.status.short !== 'NS' && m.fixture.status.short !== 'FT';
            section += `
                <div class="flex items-center justify-between p-4 border-b border-gray-800/50 hover:bg-white/5 transition">
                    <div class="text-[10px] text-gray-500 font-bold w-12">${time}</div>
                    <div class="flex-1 px-4 space-y-1">
                        <div class="flex justify-between items-center text-sm font-semibold"><span>${m.teams.home.name}</span><span>${m.goals.home ?? 0}</span></div>
                        <div class="flex justify-between items-center text-sm font-semibold"><span>${m.teams.away.name}</span><span>${m.goals.away ?? 0}</span></div>
                    </div>
                    <div class="text-[10px] font-black w-10 text-center ${isLive ? 'text-red-500 animate-pulse' : 'text-gray-600'}">
                        ${isLive ? m.fixture.status.elapsed + "'" : m.fixture.status.short}
                    </div>
                </div>`;
        });
        container.innerHTML += section + '</div>';
    }
}

// 2. JADVALNI OLISH
async function fetchStandings(leagueId) {
    const container = document.getElementById('content-area');
    try {
        const res = await fetch(`https://${API_HOST}/standings?league=${leagueId}&season=2024`, {
            headers: { "x-rapidapi-key": API_KEY, "x-rapidapi-host": API_HOST }
        });
        const data = await res.json();
        const s = data.response[0].league.standings[0];
        let html = `<div class="bg-[#161b22] rounded-xl border border-gray-800 overflow-hidden"><table class="w-full text-xs text-left">
            <thead class="bg-black text-gray-500 text-[10px]"><tr><th class="p-4">#</th><th>JAMOA</th><th>O'</th><th>OCHKO</th></tr></thead><tbody>`;
        s.forEach(t => {
            html += `<tr class="border-b border-gray-800 hover:bg-white/5">
                <td class="p-4 font-bold text-gray-500">${t.rank}</td>
                <td class="flex items-center gap-3 py-4"><img src="${t.team.logo}" class="w-5 h-5">${t.team.name}</td>
                <td>${t.all.played}</td><td class="font-black text-[#00ff85] text-sm">${t.points}</td></tr>`;
        });
        container.innerHTML = html + `</tbody></table></div>`;
    } catch (e) { container.innerHTML = "Xatolik!"; }
}

// 3. TO'PURARLARNI OLISH
async function fetchTopScorers(leagueId) {
    const container = document.getElementById('content-area');
    try {
        const res = await fetch(`https://${API_HOST}/players/topscorers?league=${leagueId}&season=2024`, {
            headers: { "x-rapidapi-key": API_KEY, "x-rapidapi-host": API_HOST }
        });
        const data = await res.json();
        let html = `<div class="bg-[#161b22] rounded-xl border border-gray-800 overflow-hidden"><table class="w-full text-xs text-left">
            <thead class="bg-black text-gray-500 text-[10px]"><tr><th class="p-4">#</th><th>O'YINCHI</th><th class="text-right p-4">GOLLAR</th></tr></thead><tbody>`;
        data.response.slice(0, 10).forEach((p, i) => {
            html += `<tr class="border-b border-gray-800 hover:bg-white/5">
                <td class="p-4 text-gray-500 font-bold">${i+1}</td>
                <td class="flex items-center gap-3 py-3"><img src="${p.player.photo}" class="w-8 h-8 rounded-full"><div><div class="font-bold">${p.player.name}</div><div class="text-[9px] text-gray-500">${p.statistics[0].team.name}</div></div></td>
                <td class="text-right p-4 font-black text-[#00ff85] text-lg">${p.statistics[0].goals.total}</td></tr>`;
        });
        container.innerHTML = html + `</tbody></table></div>`;
    } catch (e) { container.innerHTML = "Xatolik!"; }
}

// Birinchi bo'lib o'yinlarni yuklash
changeTab('matches');