/**
 * Pre-Read Document for NEM Merit Order Game
 *
 * Served at /api/pre-read — open in browser, then File > Print > Save as PDF
 * to distribute to players before the session.
 */
export function getPreReadHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NEM Merit Order Game — Player Pre-Read</title>
<style>
  @page { margin: 1.5cm 2cm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a202c; line-height: 1.6; font-size: 11pt; }
  .page { page-break-after: always; min-height: 100vh; padding: 0; }
  .page:last-child { page-break-after: avoid; }

  /* Cover page */
  .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: linear-gradient(135deg, #1e3a5f 0%, #0f1b2d 100%); color: white; min-height: 100vh; padding: 3rem; }
  .cover h1 { font-size: 2.8rem; font-weight: 800; margin-bottom: 0.5rem; letter-spacing: -1px; }
  .cover .subtitle { font-size: 1.3rem; color: #63b3ed; margin-bottom: 2rem; }
  .cover .bolt { font-size: 5rem; margin-bottom: 1.5rem; }
  .cover .tagline { font-size: 1rem; color: #a0aec0; max-width: 500px; line-height: 1.7; }
  .cover .prep-box { margin-top: 2.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 1.5rem 2rem; text-align: left; max-width: 400px; }
  .cover .prep-box h3 { color: #63b3ed; font-size: 0.9rem; margin-bottom: 0.7rem; text-transform: uppercase; letter-spacing: 1px; }
  .cover .prep-box li { color: #e2e8f0; font-size: 0.85rem; margin-bottom: 0.4rem; list-style: none; padding-left: 1.5rem; position: relative; }
  .cover .prep-box li::before { content: "\\2713"; position: absolute; left: 0; color: #48bb78; font-weight: bold; }

  /* Content pages */
  h2 { font-size: 1.5rem; color: #1e3a5f; border-bottom: 3px solid #3182ce; padding-bottom: 0.4rem; margin-bottom: 1rem; }
  h3 { font-size: 1.15rem; color: #2d3748; margin-top: 1.2rem; margin-bottom: 0.5rem; }
  h4 { font-size: 1rem; color: #3182ce; margin-top: 1rem; margin-bottom: 0.3rem; }
  p { margin-bottom: 0.6rem; }
  .content { padding: 0.5rem 0; }
  .highlight { background: #ebf8ff; border-left: 4px solid #3182ce; padding: 0.8rem 1rem; border-radius: 0 8px 8px 0; margin: 0.8rem 0; }
  .highlight-amber { background: #fffbeb; border-left: 4px solid #d69e2e; padding: 0.8rem 1rem; border-radius: 0 8px 8px 0; margin: 0.8rem 0; }
  .key-concept { background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 8px; padding: 0.8rem 1rem; margin: 0.8rem 0; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 0.8rem 0; }
  .card { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.8rem; }
  .card h4 { margin-top: 0; }
  .era { margin-bottom: 1.5rem; }
  .era-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
  .era-badge { display: inline-block; background: #3182ce; color: white; font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px; }
  .era-badge.green { background: #38a169; }
  .era-badge.amber { background: #d69e2e; }
  .era-badge.purple { background: #805ad5; }
  .era-badge.red { background: #e53e3e; }
  .stat { display: inline-block; background: #edf2f7; border-radius: 6px; padding: 0.15rem 0.5rem; font-family: monospace; font-weight: 600; font-size: 0.9rem; color: #2d3748; }
  ul { padding-left: 1.5rem; margin-bottom: 0.6rem; }
  li { margin-bottom: 0.3rem; }
  .footer { text-align: center; color: #a0aec0; font-size: 0.75rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; margin-top: auto; }
  .no-print { background: #1e3a5f; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; }
  .no-print a { color: #63b3ed; text-decoration: none; font-size: 14px; font-weight: 500; }
  .no-print a:hover { color: #90cdf4; }
  .no-print button { background: #3182ce; color: white; border: none; padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; }
  .no-print button:hover { background: #4299e1; }

  @media print {
    .no-print { display: none !important; }
    .page { page-break-after: always; }
    .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .highlight, .highlight-amber, .key-concept, .card, .era-badge, .stat, .cover .prep-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<div class="no-print">
  <a href="/">&larr; Back to Game</a>
  <button onclick="window.print()">Print / Save as PDF</button>
</div>

<!-- PAGE 1: COVER -->
<div class="page cover">
  <div class="bolt">&#9889;</div>
  <h1>NEM Merit Order Game</h1>
  <div class="subtitle">Player Pre-Read</div>
  <p class="tagline">
    An interactive electricity market simulation where you take on the role of a power generator,
    bidding your assets into the National Electricity Market.
    Compete against other teams to maximise profit across multiple rounds that mirror
    three decades of change in Australia's energy system.
  </p>
  <div class="prep-box">
    <h3>Before You Arrive</h3>
    <ul>
      <li>Bring a laptop, tablet, or smartphone (charged!)</li>
      <li>You'll connect via WiFi to join the game</li>
      <li>No software installation required &mdash; it runs in your browser</li>
      <li>Teams of 2&ndash;4 people work best</li>
      <li>Read this document to understand the basics</li>
      <li>Session runs approximately 90&ndash;120 minutes</li>
    </ul>
  </div>
</div>

<!-- PAGE 2: HOW THE GAME WORKS -->
<div class="page content">
  <h2>How the Game Works</h2>

  <p>You and your team own a portfolio of power generation assets &mdash; coal plants, gas turbines,
  wind farms, solar farms, hydro, and batteries. Each round, you submit <strong>bids</strong> to sell
  your electricity into the market.</p>

  <h3>The Bidding Process</h3>
  <p>A bid has two parts:</p>
  <div class="two-col">
    <div class="card">
      <h4>Price ($/MWh)</h4>
      <p>The minimum price you'll accept to generate. You can bid from <span class="stat">-$1,000</span> to <span class="stat">$20,000</span> per MWh.</p>
    </div>
    <div class="card">
      <h4>Quantity (MW)</h4>
      <p>How many megawatts you're offering from each asset. You can split capacity across multiple bid bands at different prices.</p>
    </div>
  </div>

  <h3>Merit Order Dispatch</h3>
  <p>AEMO (the Australian Energy Market Operator) collects ALL bids from ALL teams and sorts them cheapest to most expensive &mdash; this is the <strong>merit order</strong>.</p>
  <div class="highlight">
    <strong>Key Rule:</strong> Starting from the cheapest bid, AEMO dispatches generators one by one until total supply meets demand.
    The <strong>clearing price</strong> is set by the LAST generator dispatched (the most expensive one needed).
    <strong>ALL dispatched generators receive this same price</strong>, even if they bid lower!
  </div>

  <h3>Your Profit</h3>
  <div class="key-concept">
    <strong>Profit = (Clearing Price &minus; Your Marginal Cost) &times; Dispatched MW &times; Hours</strong><br>
    <small>Marginal Cost = Short Run Marginal Cost (your cost to produce each MWh of electricity)</small>
  </div>
  <p>Each asset type has a different marginal cost. Wind and solar have <span class="stat">$0</span> marginal cost.
  Coal is around <span class="stat">$28&ndash;42</span>, gas CCGT <span class="stat">$68&ndash;82</span>, and peakers <span class="stat">$130&ndash;155</span>.</p>

  <h3>Round Structure</h3>
  <p>Each round represents a day, divided into four 6-hour periods:</p>
  <div class="two-col">
    <div class="card">
      <h4>&#127769; Overnight (12am&ndash;6am)</h4>
      <p>Lowest demand. Baseload generation.</p>
    </div>
    <div class="card">
      <h4>&#127749; Morning (6am&ndash;12pm)</h4>
      <p>Rising demand. Industry starts up.</p>
    </div>
    <div class="card">
      <h4>&#9728;&#65039; Afternoon (12pm&ndash;6pm)</h4>
      <p>Peak solar. Can see oversupply or extreme heat demand.</p>
    </div>
    <div class="card">
      <h4>&#127750; Evening (6pm&ndash;12am)</h4>
      <p>Solar gone. Residential peak. Often highest prices.</p>
    </div>
  </div>

  <h3>Progressive Complexity</h3>
  <p>The game starts simple and builds up:</p>
  <ul>
    <li><strong>Rounds 1&ndash;2:</strong> Coal only &mdash; learn the basics of bidding and merit order</li>
    <li><strong>Rounds 3:</strong> Gas enters &mdash; different cost structures, peak pricing</li>
    <li><strong>Rounds 4:</strong> Renewables &amp; hydro &mdash; zero-cost generation reshapes the market</li>
    <li><strong>Rounds 5:</strong> Batteries &mdash; buy low, sell high arbitrage</li>
    <li><strong>Rounds 6&ndash;8:</strong> Scenarios &mdash; heatwaves, oversupply, plant outages</li>
  </ul>

  <h3>What You'll Learn</h3>
  <div class="highlight-amber">
    By the end of the game, you'll understand how electricity prices are set in Australia, why prices spike during heatwaves,
    how renewables push down daytime prices, and why batteries and flexible generation are becoming increasingly valuable.
  </div>
</div>

<!-- PAGE 3: NEM HISTORY - ERA 1 -->
<div class="page content">
  <h2>The National Electricity Market: Three Decades of Change</h2>
  <p>The game's rounds mirror the real transformation of Australia's electricity system. Here's the real-world context.</p>

  <div class="era">
    <div class="era-header">
      <span class="era-badge">1998&ndash;2008</span>
      <h3 style="margin:0">The Coal Era</h3>
    </div>
    <p>The NEM launched on 13 December 1998, connecting Queensland, New South Wales, Victoria, and South Australia
    into a single wholesale electricity market. Tasmania joined in 2005 via the Basslink interconnector.</p>

    <h4>Market Structure</h4>
    <p>Coal dominated, providing around <span class="stat">85%</span> of generation. Large state-owned generators
    were privatised or corporatised. The wholesale market operated as a uniform-price auction &mdash; the same mechanism
    you'll use in the game.</p>

    <h4>Key Events</h4>
    <ul>
      <li><strong>2004:</strong> National Electricity Law established, creating the Australian Energy Market Commission (AEMC) and the Australian Energy Regulator (AER)</li>
      <li><strong>2005:</strong> Tasmania joins via Basslink &mdash; hydro resources connect to the mainland</li>
      <li><strong>2007:</strong> Drought impacts: major water shortages reduced hydro generation across the Snowy scheme and Tasmania. Coal plants reliant on cooling water were also affected</li>
      <li><strong>2007-08:</strong> Gas prices begin rising as LNG export demand builds from Queensland</li>
    </ul>

    <h4>Bidding Dynamics</h4>
    <p>With coal the dominant fuel, prices were relatively stable. Base prices were low (<span class="stat">$25&ndash;40</span>/MWh)
    but generators learned to exercise market power during peak periods by withdrawing capacity or bidding high,
    creating occasional price spikes to the cap (then <span class="stat">$10,000</span>/MWh).</p>

    <div class="highlight">
      <strong>Game Connection:</strong> Rounds 1&ndash;2 mirror this era. You'll start with only coal assets and learn
      how the merit order works with a homogeneous fleet.
    </div>
  </div>

  <div class="era">
    <div class="era-header">
      <span class="era-badge green">2009&ndash;2017</span>
      <h3 style="margin:0">The Transition Begins</h3>
    </div>
    <p>Australia's electricity system began its most dramatic transformation. Government policy drove renewable investment
    while the economics of coal started to deteriorate.</p>

    <h4>Policy Drivers</h4>
    <ul>
      <li><strong>Renewable Energy Target (RET):</strong> Mandatory target of 20% renewables by 2020, later set at 33,000 GWh by 2020. Created the Large-scale Generation Certificate (LGC) market that subsidised wind and solar investment</li>
      <li><strong>Carbon Pricing:</strong> The Clean Energy Act 2011 introduced a carbon price (July 2012&ndash;July 2014) at <span class="stat">$23/tonne</span>. This directly increased coal marginal cost by ~$20/MWh, making gas more competitive. The scheme was repealed in 2014</li>
      <li><strong>State schemes:</strong> Various state-based feed-in tariffs and renewable auctions further accelerated deployment</li>
    </ul>

    <h4>Key Events</h4>
    <ul>
      <li><strong>2012:</strong> Carbon price takes effect &mdash; wholesale prices jump, gas becomes mid-merit</li>
      <li><strong>2014:</strong> Northern Power Station (SA) and Wallerawang (NSW) close &mdash; first major coal retirements</li>
      <li><strong>2016:</strong> South Australia's last coal plant (Playford/Northern) closes. SA becomes dependent on wind, gas, and the interconnector</li>
      <li><strong>Sept 2016:</strong> SA system black event &mdash; a state-wide blackout triggered by a severe storm, transmission tower collapse, and wind farm protection settings. A turning point for energy policy</li>
      <li><strong>2017:</strong> Hazelwood (VIC) closes &mdash; 1,600 MW of brown coal exits, causing Victorian wholesale prices to jump 85%</li>
      <li><strong>2017:</strong> Tesla Big Battery (Hornsdale Power Reserve) installed in SA in under 100 days &mdash; the world's largest lithium-ion battery at the time</li>
    </ul>

    <div class="highlight">
      <strong>Game Connection:</strong> Rounds 3&ndash;5 introduce gas, renewables, and batteries &mdash; mirroring
      how the real market became more complex with diverse generation technologies competing.
    </div>
  </div>
</div>

<!-- PAGE 4: NEM HISTORY - ERA 3 -->
<div class="page content">
  <div class="era">
    <div class="era-header">
      <span class="era-badge purple">2018&ndash;2025</span>
      <h3 style="margin:0">The Renewable Surge</h3>
    </div>
    <p>Renewables became the cheapest form of new generation. The NEM entered an era of rapid change,
    with new challenges around grid stability, negative prices, and the "duck curve."</p>

    <h4>Market Transformation</h4>
    <ul>
      <li><strong>Record renewable deployment:</strong> By 2024, over <span class="stat">20 GW</span> of wind and solar connected to the NEM. In 2024, renewables provided ~40% of NEM generation</li>
      <li><strong>Negative prices:</strong> Daytime prices regularly went negative in spring and autumn as solar flooded the market. Some coal units paid to stay online rather than face expensive restart costs</li>
      <li><strong>Battery boom:</strong> Grid-scale batteries grew from 200 MW in 2020 to over <span class="stat">4 GW</span> by 2025. Revenue from arbitrage (charging cheap, discharging at peak) and FCAS markets</li>
      <li><strong>Coal economics deteriorate:</strong> Lower average prices and reduced running hours made coal increasingly uneconomic. Liddell (NSW) closed 2023, Eraring announced early closure (since deferred)</li>
    </ul>

    <h4>Key Events</h4>
    <ul>
      <li><strong>2019&ndash;20:</strong> Black Summer bushfires, followed by energy crisis with multiple coal unit failures</li>
      <li><strong>2022:</strong> Energy crisis &mdash; global fuel price spike post-Ukraine. NEM wholesale prices hit record highs. AEMO suspended the spot market for the first time in history (June 2022)</li>
      <li><strong>2023:</strong> Liddell closes. Origin initially announced Eraring (Australia's largest coal plant, 2,880 MW) would close in 2025</li>
      <li><strong>2023&ndash;24:</strong> Capacity Investment Scheme launched &mdash; Commonwealth tenders for renewable and storage capacity</li>
      <li><strong>2024:</strong> Record rooftop solar pushes minimum demand to near-zero in SA and VIC during spring days</li>
    </ul>

    <div class="highlight">
      <strong>Game Connection:</strong> Rounds 6&ndash;8 simulate extreme scenarios from this era &mdash; summer heatwaves with record demand,
      spring oversupply with negative prices, and plant outages that test every team's portfolio management.
    </div>
  </div>

  <div class="era">
    <div class="era-header">
      <span class="era-badge red">2025&ndash;2035</span>
      <h3 style="margin:0">Looking Forward</h3>
    </div>

    <h4>The Next 5 Years (2025&ndash;2030)</h4>
    <ul>
      <li><strong>Coal exits accelerate:</strong> Most remaining coal plants expected to set closure dates. The Integrated System Plan maps an orderly transition</li>
      <li><strong>Storage explosion:</strong> Major pumped hydro (Snowy 2.0, Borumba, Pioneer-Burdekin) and continued battery deployment. Target of <span class="stat">10+ GW</span> of dispatchable storage</li>
      <li><strong>Renewable Energy Zones (REZs):</strong> Coordinated transmission and generation build in designated corridors</li>
      <li><strong>5-minute settlement:</strong> Already implemented &mdash; rewards fast-response assets (batteries) and penalises slow ones</li>
      <li><strong>Demand flexibility:</strong> Electric vehicles, smart hot water, and industrial load shifting become grid resources</li>
    </ul>

    <h4>The Next 10 Years (2030&ndash;2035)</h4>
    <ul>
      <li><strong>Near-zero emissions grid:</strong> Australia targets 82% renewables by 2030. By 2035, remaining fossil fuel generation primarily gas peakers for reliability</li>
      <li><strong>Green hydrogen:</strong> Electrolysis for industrial use and export, creating new flexible demand</li>
      <li><strong>Offshore wind:</strong> First projects expected in VIC's Gippsland region, adding a more consistent renewable source</li>
      <li><strong>Market redesign:</strong> Capacity markets, operating reserves, and new ancillary services to maintain reliability in a renewables-dominated system</li>
      <li><strong>Electrification:</strong> Transport, heating, and industry electrify &mdash; total electricity demand may increase 50%+ even as energy efficiency improves</li>
    </ul>

    <div class="highlight-amber">
      <strong>The Big Question:</strong> How do you maintain reliable supply and reasonable prices while transitioning to a
      zero-emissions electricity system? The same tension you'll experience in the game &mdash; balancing competition,
      profitability, and market outcomes &mdash; is the central challenge facing Australia's real energy policymakers today.
    </div>
  </div>
</div>

<!-- PAGE 5: STRATEGY TIPS & GLOSSARY -->
<div class="page content">
  <h2>Strategy Tips for the Game</h2>

  <div class="two-col">
    <div class="card">
      <h4>&#127919; Price Taker</h4>
      <p>Bid at $0 to guarantee dispatch. You'll earn whatever the clearing price is. Low risk, but you can't influence prices.</p>
      <p><em>Best when:</em> You want certainty, or supply is tight and you'll be dispatched anyway.</p>
    </div>
    <div class="card">
      <h4>&#128200; Marginal Cost Bidder</h4>
      <p>Bid at your marginal cost. Classic economic theory says this is the "efficient" strategy in competitive markets.</p>
      <p><em>Best when:</em> You want a balance of risk and reward.</p>
    </div>
    <div class="card">
      <h4>&#128176; Price Maker</h4>
      <p>Bid some capacity high to push up the clearing price. All your dispatched capacity benefits from the higher price.</p>
      <p><em>Best when:</em> Supply is tight, and your bid might set the clearing price.</p>
    </div>
    <div class="card">
      <h4>&#128161; Portfolio Optimiser</h4>
      <p>Different strategies for different assets. Bid renewables at $0, coal at marginal cost, and peakers aggressively high.</p>
      <p><em>Best when:</em> You have diverse assets and want to maximise across the portfolio.</p>
    </div>
  </div>

  <div class="highlight">
    <strong>The Meta-Game:</strong> The "best" strategy depends on what everyone else does. If everyone bids $0, prices crash and
    nobody profits. If everyone bids high, someone gets undercut. This strategic interaction is exactly what makes
    electricity markets fascinating &mdash; and difficult to regulate.
  </div>

  <h2 style="margin-top:1.5rem">Key Terms</h2>
  <div class="two-col">
    <div>
      <p><strong>AEMO</strong> &mdash; Australian Energy Market Operator. Runs the NEM dispatch engine.</p>
      <p><strong>Bid Band</strong> &mdash; A price/quantity pair. You can submit multiple bands per asset.</p>
      <p><strong>Clearing Price</strong> &mdash; The price of the last (most expensive) dispatched generator. Everyone dispatched receives this price.</p>
      <p><strong>Dispatch</strong> &mdash; The process of AEMO selecting which generators run to meet demand.</p>
      <p><strong>Market Cap</strong> &mdash; Maximum price: $20,000/MWh. Floor: -$1,000/MWh.</p>
    </div>
    <div>
      <p><strong>Merit Order</strong> &mdash; Bids sorted cheapest to most expensive. AEMO dispatches up the stack.</p>
      <p><strong>MW</strong> &mdash; Megawatt. A measure of power (capacity). Your plant's size.</p>
      <p><strong>MWh</strong> &mdash; Megawatt-hour. A measure of energy (power &times; time). What you sell.</p>
      <p><strong>SRMC (Short Run Marginal Cost)</strong> &mdash; Also called marginal cost. The cost to produce one additional MWh. Fuel + variable O&M.</p>
      <p><strong>Reserve Margin</strong> &mdash; How much spare capacity exists above demand. Low margins = high prices.</p>
    </div>
  </div>

  <div class="footer" style="margin-top:2rem">
    <p>NEM Merit Order Game &mdash; Player Pre-Read Document</p>
    <p>Bring your device charged. No installation required. See you at the session!</p>
  </div>
</div>

</body>
</html>`;
}
