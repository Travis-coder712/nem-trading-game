import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

// --- INITIAL GAME DATA & ROUNDS ---
const GAME_ROUNDS = [
  { id: 1, name: "The Coal Era", demand: 4500, description: "Basic bidding. High demand, low complexity.", assets: ['Coal'] },
  { id: 2, name: "Enter the Peakers", demand: 5500, description: "Demand spike! Gas peakers needed.", assets: ['Coal', 'Gas'] },
  { id: 3, name: "Solar Afternoon", demand: 3000, description: "High solar output reduces grid demand.", assets: ['Coal', 'Gas', 'Solar'] },
  { id: 4, name: "The Big Battery", demand: 6000, description: "Peak evening. Use batteries to shave the peak.", assets: ['Coal', 'Gas', 'Solar', 'Wind', 'Battery'] },
];

const INITIAL_TEAMS = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `Team ${i + 1}`,
  balance: 0,
  assets: [
    { type: 'Coal', cap: 400, srmc: 40, available: true },
    { type: 'Gas', cap: 150, srmc: 150, available: true }
  ]
}));

const App = () => {
  const [currentRound, setCurrentRound] = useState(0);
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [allBids, setAllBids] = useState({}); // { teamId: [ {price, qty} ] }
  const [view, setView] = useState('admin'); // 'admin' or 'team'
  const [activeTeamId, setActiveTeamId] = useState(1);
  const [marketHistory, setMarketHistory] = useState([]);

  const roundData = GAME_ROUNDS[currentRound];

  // --- MARKET CLEARING LOGIC ---
  const calculateDispatch = () => {
    let flatBids = [];
    Object.keys(allBids).forEach(teamId => {
      allBids[teamId].forEach(bid => {
        flatBids.push({ ...bid, teamId: parseInt(teamId) });
      });
    });

    // 1. Sort by Price (The Merit Order)
    const sortedStack = [...flatBids].sort((a, b) => a.price - b.price);

    // 2. Dispatch against demand
    let remainingDemand = roundData.demand;
    let clearingPrice = 0;
    const dispatchResults = [];

    sortedStack.forEach(bid => {
      const dispatched = Math.min(bid.qty, remainingDemand);
      if (dispatched > 0) {
        clearingPrice = bid.price;
        remainingDemand -= dispatched;
      }
      dispatchResults.push({ ...bid, dispatched, clearingPriceAtTime: clearingPrice });
    });

    // 3. Calculate Profits
    const updatedTeams = teams.map(team => {
      const teamDispatch = dispatchResults.filter(d => d.teamId === team.id);
      const profit = teamDispatch.reduce((acc, d) => {
        const cost = d.dispatched * (team.assets.find(a => a.type === d.assetType)?.srmc || 0);
        const revenue = d.dispatched * clearingPrice;
        return acc + (revenue - cost);
      }, 0);
      return { ...team, balance: team.balance + profit };
    });

    setTeams(updatedTeams);
    setMarketHistory([...marketHistory, { round: currentRound + 1, price: clearingPrice, demand: roundData.demand }]);
    alert(`Market Cleared! Spot Price: $${clearingPrice}/MWh`);
  };

  // --- UI COMPONENTS ---
  const TeamTerminal = () => {
    const myTeam = teams.find(t => t.id === activeTeamId);
    const [myBids, setMyBids] = useState({});

    const submitBids = () => {
      setAllBids({ ...allBids, [activeTeamId]: Object.values(myBids) });
      alert("Bids Locked In!");
    };

    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
        <h2 className="text-2xl font-bold border-b pb-2">{myTeam.name} Terminal</h2>
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-sm">Current Balance: <strong>${myTeam.balance.toLocaleString()}</strong></p>
          <p className="text-sm">Market Demand: <strong>{roundData.demand} MW</strong></p>
        </div>

        {myTeam.assets.map(asset => (
          <div key={asset.type} className="p-4 border rounded bg-gray-50">
            <h4 className="font-bold">{asset.type} (Cap: {asset.cap}MW)</h4>
            <p className="text-xs text-gray-500 mb-2">SRMC: ${asset.srmc}/MWh</p>
            <div className="flex gap-2">
              <input 
                type="number" placeholder="Qty (MW)" 
                className="w-1/2 p-2 border"
                onChange={(e) => setMyBids({...myBids, [asset.type]: {assetType: asset.type, qty: Number(e.target.value), price: myBids[asset.type]?.price || 0}})}
              />
              <input 
                type="number" placeholder="Price ($)" 
                className="w-1/2 p-2 border"
                onChange={(e) => setMyBids({...myBids, [asset.type]: {assetType: asset.type, qty: myBids[asset.type]?.qty || 0, price: Number(e.target.value)}})}
              />
            </div>
          </div>
        ))}
        <button onClick={submitBids} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">
          SUBMIT BIDS
        </button>
      </div>
    );
  };

  const AdminDashboard = () => (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-blue-900">NEM SIMULATOR: {roundData.name}</h1>
          <p className="text-gray-600">{roundData.description}</p>
        </div>
        <div className="flex gap-4">
          <button onClick={calculateDispatch} className="bg-red-600 text-white px-6 py-2 rounded shadow">CLEAR MARKET</button>
          <button onClick={() => setCurrentRound(prev => prev + 1)} className="bg-gray-800 text-white px-6 py-2 rounded shadow">NEXT ROUND</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEADERBOARD */}
        <div className="bg-white p-4 rounded shadow border border-gray-200">
          <h3 className="text-lg font-bold mb-4">Profit Leaderboard</h3>
          {[...teams].sort((a,b) => b.balance - a.balance).map((t, idx) => (
            <div key={t.id} className="flex justify-between border-b py-2 text-sm">
              <span>{idx + 1}. {t.name}</span>
              <span className="font-mono text-green-600">${t.balance.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* PRICE CHART */}
        <div className="lg:col-span-2 bg-white p-4 rounded shadow border border-gray-200 h-80">
          <h3 className="text-lg font-bold mb-4">Market Price History</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={marketHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="round" label={{ value: 'Round', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Price ($/MWh)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <nav className="bg-blue-900 text-white p-4 flex gap-4">
        <button onClick={() => setView('admin')} className={`px-4 py-1 rounded ${view==='admin' ? 'bg-blue-700' : ''}`}>Facilitator View</button>
        <button onClick={() => setView('team')} className={`px-4 py-1 rounded ${view==='team' ? 'bg-blue-700' : ''}`}>Team Terminal</button>
        {view === 'team' && (
          <select className="text-black text-xs" onChange={(e) => setActiveTeamId(Number(e.target.value))}>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </nav>
      {view === 'admin' ? <AdminDashboard /> : <TeamTerminal />}
    </div>
  );
};

export default App;
const SEASONAL_ROUNDS = [
  { 
    id: 5, 
    name: "Spring: The Solar Soak", 
    blocks: [
      { time: "Night", demand: 3000 },
      { time: "Midday", demand: 1500 }, // Negative price risk!
      { time: "Evening", demand: 3500 }
    ],
    event: "Negative Pricing: Renewables are flooding the grid."
  },
  { 
    id: 6, 
    name: "Winter: The Dunkelflaute", 
    blocks: [
      { time: "Morning", demand: 5500 },
      { time: "Night", demand: 4000 }
    ],
    event: "Dunkelflaute: Wind/Solar output is 0%. Prices will spike."
  }
];

// THE LEVELER FUNCTION
// Run this at the start of a round to "trip" a leading team's plant
const applyLeveler = (teams) => {
  const leader = [...teams].sort((a, b) => b.balance - a.balance)[0];
  if (leader.balance > 10000) { // Only trigger if they are significantly ahead
    leader.assets[0].available = false; // Coal plant trip
    return `${leader.name} has suffered a Boiler Tube Leak! Asset unavailable this round.`;
  }
  return null;
};
const BID_TEMPLATES = {
  "Price Taker": { price: 0, qtyPercent: 1.0 }, // Guaranteed dispatch
  "The Speculator": { price: 300, qtyPercent: 0.5 }, // Waiting for a spike
  "The Floor Trader": { price: -50, qtyPercent: 0.8 }, // Paying to stay online (Coal)
  "The Arbitrageur": { price: 15000, qtyPercent: 1.0 } // Battery discharge at Cap
};

// Inside your TeamTerminal component:
const applyTemplate = (templateName, asset) => {
  const template = BID_TEMPLATES[templateName];
  setMyBids({
    ...myBids,
    [asset.type]: {
      assetType: asset.type,
      qty: asset.cap * template.qtyPercent,
      price: template.price
    }
  });
};