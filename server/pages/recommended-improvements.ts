/**
 * Recommended Further Improvements — Prioritised roadmap for Watt Street
 * Served at /api/recommended-improvements
 */
export function getRecommendedImprovementsHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Watt Street — Recommended Further Improvements</title>
<style>
  @page { margin: 1.5cm 2cm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a202c; line-height: 1.7; font-size: 11pt; background: #f7fafc; }
  .container { max-width: 960px; margin: 0 auto; padding: 2rem 2rem 4rem; }
  .header { background: linear-gradient(135deg, #1e3a5f 0%, #0f1b2d 100%); color: white; padding: 2.5rem 2rem; border-radius: 12px; margin-bottom: 2rem; text-align: center; }
  .header h1 { font-size: 2rem; font-weight: 800; margin-bottom: 0.3rem; }
  .header .subtitle { color: #63b3ed; font-size: 1.05rem; }
  h2 { font-size: 1.4rem; color: #1e3a5f; border-bottom: 3px solid #3182ce; padding-bottom: 0.4rem; margin: 2.5rem 0 1rem; }
  h3 { font-size: 1.15rem; color: #2d3748; margin-top: 1.5rem; margin-bottom: 0.5rem; }
  h4 { font-size: 1rem; color: #4a5568; margin-top: 1rem; margin-bottom: 0.3rem; }
  p { margin-bottom: 0.8rem; }
  ul, ol { margin: 0.5rem 0 1rem 1.5rem; }
  li { margin-bottom: 0.4rem; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
  th, td { border: 1px solid #e2e8f0; padding: 0.6rem 0.8rem; text-align: left; }
  th { background: #edf2f7; font-weight: 600; color: #2d3748; }
  tr:nth-child(even) { background: #f7fafc; }
  .card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.2rem 1.5rem; margin: 1rem 0; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .tip { background: #ebf8ff; border-left: 4px solid #3182ce; padding: 0.8rem 1rem; border-radius: 0 8px 8px 0; margin: 0.8rem 0; }
  .warning { background: #fffbeb; border-left: 4px solid #d69e2e; padding: 0.8rem 1rem; border-radius: 0 8px 8px 0; margin: 0.8rem 0; }
  .highlight { background: #f0fff4; border-left: 4px solid #38a169; padding: 0.8rem 1rem; border-radius: 0 8px 8px 0; margin: 0.8rem 0; }
  .critical { background: #fff5f5; border-left: 4px solid #e53e3e; padding: 0.8rem 1rem; border-radius: 0 8px 8px 0; margin: 0.8rem 0; }
  .priority-badge { display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px; margin-right: 0.4rem; vertical-align: middle; }
  .p-high { background: #fed7d7; color: #c53030; }
  .p-medium { background: #fefcbf; color: #975a16; }
  .p-low { background: #c6f6d5; color: #276749; }
  .p-idea { background: #e9d8fd; color: #553c9a; }
  .effort-badge { display: inline-block; font-size: 0.70rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 12px; vertical-align: middle; color: #4a5568; background: #edf2f7; }
  .tag { display: inline-block; font-size: 0.72rem; font-weight: 600; padding: 0.15rem 0.55rem; border-radius: 20px; margin-right: 0.3rem; }
  .tag-ui { background: #dbeafe; color: #1e40af; }
  .tag-gameplay { background: #fce7f3; color: #9d174d; }
  .tag-technical { background: #e0e7ff; color: #3730a3; }
  .tag-simplify { background: #d1fae5; color: #065f46; }
  .tag-education { background: #fef3c7; color: #92400e; }
  .improvement-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem 1.2rem; margin: 0.8rem 0; box-shadow: 0 1px 3px rgba(0,0,0,0.06); page-break-inside: avoid; }
  .improvement-card h4 { margin-top: 0; color: #1e3a5f; font-size: 1.05rem; }
  .improvement-card .meta { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.4rem 0 0.7rem; align-items: center; }
  .pro-con-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-top: 0.8rem; }
  .pro-con-grid .pro { background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 8px; padding: 0.7rem; }
  .pro-con-grid .con { background: #fffaf0; border: 1px solid #feebc8; border-radius: 8px; padding: 0.7rem; }
  .pro-con-grid h5 { font-size: 0.85rem; margin-bottom: 0.3rem; }
  .pro-con-grid ul { margin: 0.2rem 0 0 1.2rem; font-size: 0.85rem; }
  .mode-compare { border: 2px solid #3182ce; border-radius: 12px; overflow: hidden; margin: 1.5rem 0; }
  .mode-compare .mode-header { background: linear-gradient(135deg, #1e3a5f 0%, #2d4a7a 100%); color: white; padding: 1rem 1.2rem; }
  .mode-compare .mode-header h3 { color: white; margin: 0; font-size: 1.2rem; }
  .mode-compare .mode-body { padding: 1rem 1.2rem; }
  .round-list { counter-reset: roundNum; list-style: none; margin-left: 0; padding-left: 0; }
  .round-list li { counter-increment: roundNum; position: relative; padding: 0.8rem 0.8rem 0.8rem 3rem; margin-bottom: 0.5rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; }
  .round-list li::before { content: counter(roundNum); position: absolute; left: 0.7rem; top: 0.75rem; width: 1.6rem; height: 1.6rem; background: #3182ce; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; }
  .back-link { display: inline-block; margin-bottom: 1rem; color: #3182ce; text-decoration: none; font-weight: 600; }
  .back-link:hover { text-decoration: underline; }
  .print-btn { display: inline-block; background: #3182ce; color: white; border: none; padding: 0.5rem 1.2rem; border-radius: 8px; font-size: 0.9rem; cursor: pointer; text-decoration: none; margin-left: 0.5rem; }
  .print-btn:hover { background: #2b6cb0; }
  .toc { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.2rem 1.5rem; margin: 1rem 0; }
  .toc ol { margin-left: 1.2rem; }
  .toc li { margin-bottom: 0.3rem; }
  .toc a { color: #3182ce; text-decoration: none; }
  .toc a:hover { text-decoration: underline; }
  @media (max-width: 700px) { .pro-con-grid { grid-template-columns: 1fr; } }
  @media print {
    .no-print { display: none !important; }
    body { background: white; }
    .container { padding: 0; }
    .improvement-card { page-break-inside: avoid; }
    .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="container">
  <div class="no-print" style="display: flex; justify-content: space-between; align-items: center;">
    <a href="/" class="back-link">&larr; Back to Game</a>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div style="font-size: 3rem; margin-bottom: 0.5rem;">&#128640;</div>
    <h1>Recommended Further Improvements</h1>
    <div class="subtitle">Prioritised roadmap for Watt Street</div>
  </div>

  <!-- Table of Contents -->
  <div class="toc">
    <h3 style="margin-top: 0;">Contents</h3>
    <ol>
      <li><a href="#new-mode">New Game Mode: &ldquo;Progressive Learning&rdquo;</a></li>
      <li><a href="#mode-comparison">Game Mode Comparison</a></li>
      <li><a href="#high-impact">High Priority &mdash; Highest Impact Improvements</a></li>
      <li><a href="#medium-impact">Medium Priority &mdash; Polish &amp; Enhancement</a></li>
      <li><a href="#low-impact">Lower Priority &mdash; Nice-to-Have</a></li>
      <li><a href="#simplification">Simplification Ideas</a></li>
      <li><a href="#facilitation">Facilitation &amp; Smoothness Tips</a></li>
    </ol>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 1: NEW GAME MODE                          -->
  <!-- ═══════════════════════════════════════════════════ -->
  <h2 id="new-mode">1. New Game Mode: &ldquo;Progressive Learning&rdquo; (10 Rounds)</h2>

  <div class="highlight">
    <strong>&#127919; Design Goal:</strong> Build participant knowledge layer-by-layer, from &ldquo;what is a bid?&rdquo; to &ldquo;how do I optimise a portfolio under uncertainty?&rdquo; Each round introduces exactly one new concept, with the host explaining that concept before bidding opens. Designed for groups playing once, where every participant must walk away understanding the NEM.
  </div>

  <p>This mode sits between Quick Game (8 rounds, 60&ndash;90 min) and Full Game (15 rounds, 2.5&ndash;3.5 hours). It takes approximately <strong>90&ndash;120 minutes</strong> and is structured so that every round has a single, clear teaching objective announced before bidding starts.</p>

  <h3>Round-by-Round Design</h3>

  <ol class="round-list">
    <li>
      <strong>What Is a Bid?</strong>
      <span class="tag tag-education">Concept: Bidding</span><br>
      <em>Coal only &bull; 1 period (Afternoon) &bull; 2 bands &bull; 360s &bull; Autumn</em><br>
      Fully guided walkthrough with pre-filled bids. Host explains: &ldquo;A bid is the price you&rsquo;re willing to sell at. The cheapest bids get dispatched first.&rdquo; Only one time period so teams focus purely on understanding the bidding interface and merit order stacking. Very low demand variability for predictable outcomes.
      <div class="tip"><strong>Teaching moment:</strong> After results, walk through the merit order chart on the big screen. Point at each stacked bid. Show the clearing price line. Ask: &ldquo;Who set the clearing price?&rdquo;</div>
    </li>

    <li>
      <strong>Clearing Price &amp; Uniform Pricing</strong>
      <span class="tag tag-education">Concept: Clearing Price</span><br>
      <em>Coal only &bull; 2 periods (Morning + Afternoon) &bull; 3 bands &bull; 240s &bull; Autumn</em><br>
      No walkthrough this time &mdash; teams bid independently. Two periods show that different demand levels produce different clearing prices. Host explains before bidding: &ldquo;Everyone gets paid the same clearing price, even if you bid $0. The most expensive dispatched bid sets the price for ALL generators.&rdquo;
      <div class="tip"><strong>Teaching moment:</strong> Compare the clearing prices between the two periods. &ldquo;Morning demand was lower, so the clearing price was only $X. Afternoon was higher, so the price jumped to $Y. Even your coal that bid $0 got paid $Y in the afternoon.&rdquo;</div>
    </li>

    <li>
      <strong>Demand Shapes the Market</strong>
      <span class="tag tag-education">Concept: Demand Patterns</span><br>
      <em>Coal only &bull; 4 periods (full day) &bull; 5 bands &bull; 210s &bull; Autumn</em><br>
      First full 24-hour cycle. Much higher evening demand than overnight. Host explains: &ldquo;Demand changes through the day. Overnight is low &mdash; only essential load. Evening is peak &mdash; everyone is home cooking and running appliances. How should you bid differently across the day?&rdquo;
      <div class="tip"><strong>Teaching moment:</strong> Show the four clearing prices. &ldquo;Notice how overnight was $X and evening was $Y. Higher demand = higher prices. This is why time-of-day matters.&rdquo;</div>
    </li>

    <li>
      <strong>Different Costs, Different Roles</strong>
      <span class="tag tag-education">Concept: Merit Order &amp; Cost Structures</span><br>
      <em>+ Gas CCGT + Gas Peaker &bull; 4 periods &bull; 5 bands &bull; 240s &bull; Autumn</em><br>
      Gas enters the market. Host explains: &ldquo;Your new gas plants cost more to run than coal. Check the coloured marginal cost badges. Gas CCGT costs ~$75/MWh. The Gas Peaker costs ~$140/MWh. They sit higher in the merit order. But when demand is high enough, the peaker runs and sets a HIGH clearing price &mdash; which means your cheap coal earns enormous profit.&rdquo;
      <div class="tip"><strong>Teaching moment:</strong> &ldquo;This gap between your cost and the clearing price is called <em>infra-marginal profit</em>. It&rsquo;s the key to understanding why cheap assets love expensive price-setters.&rdquo;</div>
    </li>

    <li>
      <strong>Zero-Cost Renewables Change Everything</strong>
      <span class="tag tag-education">Concept: Renewables &amp; Duck Curve</span><br>
      <em>+ Wind + Solar + Hydro &bull; 4 periods &bull; 7 bands &bull; 270s &bull; Spring</em><br>
      Renewables flood the market. Spring season means mild demand + strong solar. Host explains: &ldquo;Wind and solar cost $0 to generate. They&rsquo;ll always bid at the bottom of the merit order. When there&rsquo;s lots of sun, midday prices collapse. But come evening, solar disappears and demand surges &mdash; this is the duck curve.&rdquo;
      <div class="tip"><strong>Teaching moment:</strong> Compare midday vs evening clearing prices. &ldquo;Midday was $X because solar flooded the market. Evening jumped to $Y because solar disappeared. This shape &mdash; low in the middle, high at the edges &mdash; is the duck curve. It&rsquo;s reshaping Australia&rsquo;s energy market right now.&rdquo;</div>
    </li>

    <li>
      <strong>Battery Arbitrage &mdash; Buy Low, Sell High</strong>
      <span class="tag tag-education">Concept: Storage &amp; Arbitrage</span><br>
      <em>+ Battery &bull; 4 periods &bull; 10 bands &bull; 300s &bull; Spring</em><br>
      Full portfolio. Host explains: &ldquo;Your battery can charge during cheap periods and discharge during expensive ones. It&rsquo;s like buying electricity wholesale at $20/MWh and selling it at $200/MWh. But you lose 15% in the round trip. Your goal: maximise the spread.&rdquo; Extra time (300s) because batteries add complexity.
      <div class="tip"><strong>Teaching moment:</strong> Find the team with the best battery profit. &ldquo;Team X charged at $Y and discharged at $Z, earning $W from their battery alone. That&rsquo;s arbitrage in action.&rdquo;</div>
    </li>

    <li>
      <strong>Bidding Strategy Matters</strong>
      <span class="tag tag-education">Concept: Strategies</span><br>
      <em>All assets &bull; 4 periods &bull; 10 bands &bull; 240s &bull; Autumn</em><br>
      Calm autumn round focused on applying strategies. Before this round, the host runs the <strong>Strategy Guide presentation</strong> (already built into the game) explaining Price Taker, Marginal Cost, Price Maker, Portfolio Optimiser, Withdrawal, and Arbitrageur. Teams are encouraged to use the &ldquo;Strategy Auto-Fill&rdquo; dropdown during bidding. Reduced demand variability so strategy differences are clearly visible in results.
      <div class="tip"><strong>Teaching moment:</strong> Compare teams&rsquo; results. &ldquo;Team A was a price-taker &mdash; they got dispatched every period but at low margins. Team B tried price-making &mdash; they pushed the clearing price up but risked not being dispatched. Which worked better this round?&rdquo;</div>
    </li>

    <li>
      <strong>Scarcity &mdash; When Supply Runs Short</strong>
      <span class="tag tag-education">Concept: Scarcity Pricing</span><br>
      <em>All assets &bull; 4 periods &bull; 10 bands &bull; 240s &bull; Summer</em><br>
      <span class="tag tag-gameplay">Scenario: Extreme Heatwave</span><br>
      Demand surges +40% afternoon, coal derates -10%. Host explains: &ldquo;An extreme heatwave has hit. Air conditioning demand is through the roof. Some coal plants are derated from cooling water temperatures. When demand exceeds easy supply, the clearing price can spike to $20,000/MWh &mdash; the market cap. This is where the real money is made or lost.&rdquo;
      <div class="tip"><strong>Teaching moment:</strong> &ldquo;The clearing price hit $X in the afternoon. That means EVERY generator &mdash; even your $35 coal &mdash; got paid $X per MWh. This is how scarcity events deliver 10&times; normal profits to anyone who was dispatched.&rdquo;</div>
    </li>

    <li>
      <strong>Oversupply &amp; Negative Prices</strong>
      <span class="tag tag-education">Concept: Negative Pricing</span><br>
      <em>All assets &bull; 4 periods &bull; 10 bands &bull; 240s &bull; Spring</em><br>
      <span class="tag tag-gameplay">Scenario: Spring Oversupply / Negative Prices</span><br>
      Demand drops 30%, solar +30%, wind +20%. Host explains: &ldquo;Now the opposite extreme. Supply massively exceeds demand. Generators start bidding negative just to stay dispatched &mdash; they&rsquo;d rather pay to keep running than shut down and restart. If the clearing price goes negative, generators are paying to produce electricity. Batteries love this &mdash; they get paid to charge!&rdquo;
      <div class="tip"><strong>Teaching moment:</strong> &ldquo;This happens in the real NEM regularly, especially in spring in South Australia. In 2024 there were over 100 trading intervals with negative prices. If you owned a coal plant, would you bid negative or shut down?&rdquo;</div>
    </li>

    <li>
      <strong>The Full NEM Challenge &#127942;</strong>
      <span class="tag tag-education">Concept: Everything Together</span><br>
      <em>All assets &bull; 4 periods &bull; 10 bands &bull; 300s &bull; Summer</em><br>
      <span class="tag tag-gameplay">Scenario: Moderate Heatwave + Random Plant Outage</span><br>
      Final round combining everything. One team randomly loses a coal plant. Elevated demand. Cumulative profit determines the winner. Host announces: &ldquo;This is it &mdash; everything you&rsquo;ve learned comes together. Manage your portfolio, pick your strategy, adapt to the conditions. May the best energy trader win.&rdquo;
      <div class="tip"><strong>Teaching moment:</strong> Review the leaderboard. &ldquo;The winning team succeeded because they adapted. They didn&rsquo;t use the same strategy every round. They read the market conditions and responded.&rdquo;</div>
    </li>
  </ol>

  <h3>Key Differences From Existing Modes</h3>
  <table>
    <tr><th>Feature</th><th>Progressive Learning (New)</th><th>Quick Game</th><th>Full Game</th></tr>
    <tr>
      <td>Rounds</td>
      <td><strong>10</strong></td>
      <td>8</td>
      <td>15</td>
    </tr>
    <tr>
      <td>Duration</td>
      <td><strong>90&ndash;120 min</strong></td>
      <td>60&ndash;90 min</td>
      <td>2.5&ndash;3.5 hours</td>
    </tr>
    <tr>
      <td>Concept-per-round</td>
      <td><strong>Exactly one new concept</strong></td>
      <td>Sometimes bundles concepts</td>
      <td>Gradual but not always one-per-round</td>
    </tr>
    <tr>
      <td>Host teaching prompts</td>
      <td><strong>Built into every round</strong></td>
      <td>In Game Master&rsquo;s Guide only</td>
      <td>In Game Master&rsquo;s Guide only</td>
    </tr>
    <tr>
      <td>Strategies round</td>
      <td><strong>Dedicated round (R7)</strong></td>
      <td>Not explicit</td>
      <td>Round 4 mentions it</td>
    </tr>
    <tr>
      <td>Scenarios</td>
      <td><strong>2 (heatwave + oversupply)</strong></td>
      <td>3 (heatwave, negative, mixed)</td>
      <td>8+ across 7 rounds</td>
    </tr>
    <tr>
      <td>Asset unlock pace</td>
      <td><strong>Coal (R1-3) &rarr; Gas (R4) &rarr; Renewables+Hydro (R5) &rarr; Battery (R6)</strong></td>
      <td>Coal &rarr; Gas (R3) &rarr; All renewables (R4) &rarr; Battery (R5)</td>
      <td>Coal (R1-4) &rarr; Gas (R5) &rarr; Renewables (R6-7) &rarr; Battery (R8)</td>
    </tr>
  </table>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 2: MODE COMPARISON                        -->
  <!-- ═══════════════════════════════════════════════════ -->
  <h2 id="mode-comparison">2. Game Mode Comparison &mdash; Pros &amp; Cons</h2>

  <div class="mode-compare">
    <div class="mode-header"><h3>&#127891; Progressive Learning (NEW) &mdash; 10 rounds, 90&ndash;120 min</h3></div>
    <div class="mode-body">
      <p><strong>Best for:</strong> First-time players in a half-day workshop where deep understanding matters more than speed. University lectures, corporate energy literacy training, onboarding new market analysts.</p>
      <div class="pro-con-grid">
        <div class="pro">
          <h5>&#9989; Pros</h5>
          <ul>
            <li>Each round has exactly one learning objective &mdash; no cognitive overload</li>
            <li>Host teaching prompts built into every round briefing &mdash; the game master knows exactly what to say</li>
            <li>Dedicated &ldquo;strategies&rdquo; round lets teams experiment before high-stakes scenarios</li>
            <li>Three coal-only rounds build muscle memory on the interface before complexity increases</li>
            <li>Clear narrative arc: basics &rarr; technology &rarr; strategy &rarr; extremes &rarr; finale</li>
            <li>Post-round teaching moments designed for group discussion</li>
          </ul>
        </div>
        <div class="con">
          <h5>&#9888;&#65039; Cons</h5>
          <ul>
            <li>Longer than Quick Game &mdash; needs 90&ndash;120 min</li>
            <li>Three coal-only rounds may feel slow for already-knowledgeable participants</li>
            <li>Fewer scenario events than Full Game (only 2 vs 8+)</li>
            <li>Does not cover carbon pricing, drought, dunkelflaute, or cold snaps</li>
            <li>Less replay value since it&rsquo;s designed for first-timers</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div class="mode-compare">
    <div class="mode-header"><h3>&#9889; Quick Game (Existing) &mdash; 8 rounds, 60&ndash;90 min</h3></div>
    <div class="mode-body">
      <p><strong>Best for:</strong> Time-constrained workshops where you need to cover the full technology stack quickly. Teams with some background knowledge. Lunch-and-learn sessions.</p>
      <div class="pro-con-grid">
        <div class="pro">
          <h5>&#9989; Pros</h5>
          <ul>
            <li>Fastest mode to cover coal-to-battery full portfolio</li>
            <li>Gets to interesting scenarios (heatwave, negative prices) quickly</li>
            <li>Fits comfortably in a 90-minute workshop slot</li>
            <li>Good competitive energy &mdash; 8 rounds is enough for leaderboard drama</li>
          </ul>
        </div>
        <div class="con">
          <h5>&#9888;&#65039; Cons</h5>
          <ul>
            <li>Introduces renewables AND hydro in the same round (R4) &mdash; steep jump</li>
            <li>Only one coal-only round before adding gas &mdash; less interface practice time</li>
            <li>No dedicated strategy teaching round</li>
            <li>Teaching prompts only in Game Master&rsquo;s Guide, not in the game itself</li>
            <li>Pace can be overwhelming for complete beginners</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div class="mode-compare">
    <div class="mode-header"><h3>&#128218; Full Game (Existing) &mdash; 15 rounds, 2.5&ndash;3.5 hours</h3></div>
    <div class="mode-body">
      <p><strong>Best for:</strong> Full-day training, university courses, or deep-dive workshops. Groups that have dedicated half a day to energy market education.</p>
      <div class="pro-con-grid">
        <div class="pro">
          <h5>&#9989; Pros</h5>
          <ul>
            <li>Most comprehensive &mdash; covers every scenario including carbon pricing</li>
            <li>Four coal-only rounds give ample practice time</li>
            <li>Each asset type gets its own introduction round</li>
            <li>Best for deep understanding and nuanced strategy development</li>
            <li>Covers advanced topics (dunkelflaute, drought, demand response)</li>
          </ul>
        </div>
        <div class="con">
          <h5>&#9888;&#65039; Cons</h5>
          <ul>
            <li>Very long &mdash; 2.5&ndash;3.5 hours requires serious time commitment</li>
            <li>Can lose energy in the middle if pacing isn&rsquo;t managed carefully</li>
            <li>15 rounds may be too many for groups that aren&rsquo;t deeply engaged</li>
            <li>Four coal-only rounds can feel repetitive for faster learners</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div class="mode-compare">
    <div class="mode-header"><h3>&#127942; Experienced Replay (Existing) &mdash; 4 rounds, 30&ndash;45 min</h3></div>
    <div class="mode-body">
      <p><strong>Best for:</strong> Teams who have played before and want to test strategies against challenging scenarios. End-of-session bonus round. Competitions.</p>
      <div class="pro-con-grid">
        <div class="pro">
          <h5>&#9989; Pros</h5>
          <ul>
            <li>Fast and intense &mdash; full portfolio from round 1</li>
            <li>One round per season shows all market dynamics</li>
            <li>Every round has a challenging scenario</li>
            <li>Great for competitions and repeat play</li>
          </ul>
        </div>
        <div class="con">
          <h5>&#9888;&#65039; Cons</h5>
          <ul>
            <li>Not suitable for beginners &mdash; no onboarding or progression</li>
            <li>Too fast for first-time players to learn</li>
            <li>Only 4 rounds means less leaderboard drama</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div class="tip">
    <strong>&#128161; Recommendation for a single play-through session (2 hours):</strong> Use the <strong>Progressive Learning</strong> mode. It maximises understanding per minute and gives the game master clear talking points at every stage. For a longer session (3+ hours), start with Progressive Learning, take a break, then finish with Experienced Replay &mdash; teams can apply everything they&rsquo;ve learned in a high-stakes rapid-fire format.
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 3: HIGH PRIORITY                          -->
  <!-- ═══════════════════════════════════════════════════ -->
  <h2 id="high-impact">3. High Priority &mdash; Highest Impact Improvements</h2>

  <div class="improvement-card">
    <h4>3.1 &nbsp; Host &ldquo;Teaching Prompt&rdquo; Cards Between Rounds</h4>
    <div class="meta">
      <span class="priority-badge p-high">HIGH PRIORITY</span>
      <span class="tag tag-gameplay">Gameplay</span>
      <span class="tag tag-education">Education</span>
      <span class="effort-badge">Medium effort</span>
    </div>
    <p>The game master is the most important element for a one-off session. Currently, the host needs to refer to the Game Master&rsquo;s Guide (a separate page) for what to say between rounds. Instead, display <strong>context-specific teaching prompts directly on the host dashboard</strong> during the results/between-rounds phase.</p>
    <ul>
      <li>Show 2&ndash;3 &ldquo;what to say&rdquo; bullet points after each round&rsquo;s results</li>
      <li>Include a suggested discussion question (&ldquo;Ask the room: Who set the clearing price and why?&rdquo;)</li>
      <li>Highlight the key teaching point for the NEXT round (&ldquo;Next: Gas enters the market. Key concept: different costs, different roles.&rdquo;)</li>
      <li>Data can come from the existing <code>roundConfig</code> &mdash; add a <code>hostTeachingNotes</code> field</li>
    </ul>
    <p><strong>Why it matters:</strong> Reduces game master cognitive load. The facilitator shouldn&rsquo;t need to memorise or look up what to say. The game should tell them.</p>
  </div>

  <div class="improvement-card">
    <h4>3.2 &nbsp; &ldquo;What Just Happened?&rdquo; Plain-English Round Summary for Teams</h4>
    <div class="meta">
      <span class="priority-badge p-high">HIGH PRIORITY</span>
      <span class="tag tag-ui">UI</span>
      <span class="tag tag-education">Education</span>
      <span class="effort-badge">Medium effort</span>
    </div>
    <p>After results are displayed, show teams a 2&ndash;3 sentence <strong>plain-English narrative</strong> of what happened that round, contextualised to their team&rsquo;s performance. Example:</p>
    <div class="card" style="background: #f0fff4; font-style: italic;">
      &ldquo;The evening clearing price spiked to $485/MWh because demand was very tight at 92% of fleet capacity. Your coal plant earned $12,400 in infra-marginal profit from this single period because you bid it at $35 but were paid $485. However, your gas peaker wasn&rsquo;t dispatched because 3 other teams bid their peakers lower.&rdquo;
    </div>
    <p>This bridges the gap between raw numbers and understanding. Use the existing <code>TeamAnalysis</code> data plus per-period dispatch info to generate this narrative. The round analysis already has strengths/improvements &mdash; this would be a more conversational wrapper.</p>
  </div>

  <div class="improvement-card">
    <h4>3.3 &nbsp; Animated Merit Order Replay on Host Screen After Each Round</h4>
    <div class="meta">
      <span class="priority-badge p-high">HIGH PRIORITY</span>
      <span class="tag tag-ui">UI</span>
      <span class="tag tag-education">Education</span>
      <span class="effort-badge">High effort</span>
    </div>
    <p>The merit order walkthrough already exists but requires manual navigation. For one-off sessions, the host should be able to trigger a <strong>cinematic auto-playing animation</strong> that:</p>
    <ol>
      <li>Shows an empty dispatch chart</li>
      <li>Stacks bids one by one from cheapest to most expensive (with labels showing team name + asset)</li>
      <li>Draws the demand line across</li>
      <li>Highlights where demand intersects the stack &mdash; &ldquo;This is the clearing price!&rdquo;</li>
      <li>Shows the clearing price line and labels the price-setting bid</li>
    </ol>
    <p>This is the single most powerful teaching tool. Seeing bids physically stack up and the clearing price emerge from the intersection is the &ldquo;aha moment&rdquo; for most participants.</p>
  </div>

  <div class="improvement-card">
    <h4>3.4 &nbsp; Simplify First-Round Bidding Interface</h4>
    <div class="meta">
      <span class="priority-badge p-high">HIGH PRIORITY</span>
      <span class="tag tag-ui">UI</span>
      <span class="tag tag-simplify">Simplify</span>
      <span class="effort-badge">Medium effort</span>
    </div>
    <p>The bidding screen can be overwhelming on first use, especially on mobile. For rounds with <code>walkthrough</code> enabled (Round 1 in most modes), show a <strong>simplified view</strong>:</p>
    <ul>
      <li>Hide the Strategy Auto-Fill panel entirely</li>
      <li>Hide the help buttons bar (teams haven&rsquo;t learned enough for them to be useful yet)</li>
      <li>Show larger, clearer bid input fields with more spacing</li>
      <li>Pre-fill walkthrough bids with prominent &ldquo;We suggest this bid&rdquo; labels</li>
      <li>Add a &ldquo;Use Suggested Bids&rdquo; one-tap button that fills everything and opens the review screen</li>
    </ul>
    <p><strong>Why it matters:</strong> Cognitive overload in Round 1 is the #1 risk for new players. If they struggle with the interface, they miss the learning. Getting them through Round 1 smoothly is critical for engagement in all subsequent rounds.</p>
  </div>

  <div class="improvement-card">
    <h4>3.5 &nbsp; &ldquo;Next Round Preview&rdquo; on Host Dashboard</h4>
    <div class="meta">
      <span class="priority-badge p-high">HIGH PRIORITY</span>
      <span class="tag tag-gameplay">Gameplay</span>
      <span class="effort-badge">Low effort</span>
    </div>
    <p>During the results phase, show the host a small card previewing the next round: name, new assets, new concepts, and any scenario events. This lets the host transition smoothly: &ldquo;Great discussion. Now, in the next round, gas power enters the market&hellip;&rdquo;</p>
    <p>Data already exists in the round configs. Just need to read <code>rounds[currentRound]</code> during the results phase and display it.</p>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 4: MEDIUM PRIORITY                        -->
  <!-- ═══════════════════════════════════════════════════ -->
  <h2 id="medium-impact">4. Medium Priority &mdash; Polish &amp; Enhancement</h2>

  <div class="improvement-card">
    <h4>4.1 &nbsp; Sound Effects &amp; Audio Cues</h4>
    <div class="meta">
      <span class="priority-badge p-medium">MEDIUM</span>
      <span class="tag tag-ui">UI</span>
      <span class="tag tag-gameplay">Gameplay</span>
      <span class="effort-badge">Medium effort</span>
    </div>
    <p>Add optional, subtle audio cues to key moments:</p>
    <ul>
      <li>Countdown beeps in last 30 seconds of bidding (creates urgency)</li>
      <li>Dramatic sound when clearing price is revealed (builds anticipation)</li>
      <li>Cash register &ldquo;cha-ching&rdquo; for top profit earner</li>
      <li>Sad trombone for team that lost the most</li>
      <li>Ambient market trading floor sounds during bidding phase (the AudioController component already exists on the landing page)</li>
    </ul>
    <p>All audio should be off by default and controlled by the host. Sound transforms a screen exercise into a room experience.</p>
  </div>

  <div class="improvement-card">
    <h4>4.2 &nbsp; Team Name Colour Badges on All Screens</h4>
    <div class="meta">
      <span class="priority-badge p-medium">MEDIUM</span>
      <span class="tag tag-ui">UI</span>
      <span class="effort-badge">Low effort</span>
    </div>
    <p>Each team already has an assigned colour in the leaderboard. Show a small coloured dot or badge next to team names everywhere they appear (host sidebar, bid status, merit order chart labels, results). This helps participants quickly identify &ldquo;that&rsquo;s us!&rdquo; on the big screen, especially in rooms with 10+ teams.</p>
  </div>

  <div class="improvement-card">
    <h4>4.3 &nbsp; &ldquo;Market Snapshot&rdquo; Between-Round Infographic</h4>
    <div class="meta">
      <span class="priority-badge p-medium">MEDIUM</span>
      <span class="tag tag-ui">UI</span>
      <span class="tag tag-education">Education</span>
      <span class="effort-badge">Medium effort</span>
    </div>
    <p>Between rounds, show a single-screen infographic on the host dashboard summarising:</p>
    <ul>
      <li>Clearing prices per period (bar chart)</li>
      <li>Which team set the price in each period (with their colour dot)</li>
      <li>Total market revenue vs total market cost</li>
      <li>A single highlighted &ldquo;Insight of the Round&rdquo; (&ldquo;The Peaker set the evening price &mdash; this is why coal loves peakers!&rdquo;)</li>
    </ul>
    <p>Purpose: Give the host a single visual to project while they narrate. Currently they need to flip between multiple views.</p>
  </div>

  <div class="improvement-card">
    <h4>4.4 &nbsp; Bid Confirmation Haptic Feedback (Mobile)</h4>
    <div class="meta">
      <span class="priority-badge p-medium">MEDIUM</span>
      <span class="tag tag-ui">UI</span>
      <span class="effort-badge">Low effort</span>
    </div>
    <p>When a team submits their bids on mobile, trigger a short vibration (<code>navigator.vibrate(50)</code>) to confirm the action went through. Useful in noisy rooms where a visual-only confirmation might be missed.</p>
  </div>

  <div class="improvement-card">
    <h4>4.5 &nbsp; Historical Price Trend Chart on Team Screen</h4>
    <div class="meta">
      <span class="priority-badge p-medium">MEDIUM</span>
      <span class="tag tag-ui">UI</span>
      <span class="tag tag-education">Education</span>
      <span class="effort-badge">Medium effort</span>
    </div>
    <p>After Round 2+, show teams a small line chart of clearing prices across rounds. This helps them see market trends and adjust strategies. &ldquo;Prices have been rising each round &mdash; maybe I should bid higher.&rdquo; Data already exists in round results history.</p>
  </div>

  <div class="improvement-card">
    <h4>4.6 &nbsp; &ldquo;Quick Recap&rdquo; Card at Start of Bidding Phase</h4>
    <div class="meta">
      <span class="priority-badge p-medium">MEDIUM</span>
      <span class="tag tag-education">Education</span>
      <span class="tag tag-simplify">Simplify</span>
      <span class="effort-badge">Low effort</span>
    </div>
    <p>At the top of the bidding screen, show a small, dismissible card that says: &ldquo;Last round&rsquo;s clearing price was $X&ndash;$Y. This round: [1-line new concept or scenario]. Key tip: [single actionable suggestion].&rdquo; This contextual nudge reduces the need to remember what happened previously.</p>
  </div>

  <div class="improvement-card">
    <h4>4.7 &nbsp; Improve Mobile Number Input UX</h4>
    <div class="meta">
      <span class="priority-badge p-medium">MEDIUM</span>
      <span class="tag tag-ui">UI</span>
      <span class="tag tag-technical">Technical</span>
      <span class="effort-badge">Low effort</span>
    </div>
    <p>Use <code>inputMode="decimal"</code> on all bid price/quantity inputs to ensure mobile keyboards show the number pad by default. Also consider using larger touch targets (min 44px height) and clearer active/focus states for bid input fields. Currently, switching between $/MWh and MW fields on a phone can be fiddly.</p>
  </div>

  <div class="improvement-card">
    <h4>4.8 &nbsp; Auto-Advance Host to Next Phase After All Bids In</h4>
    <div class="meta">
      <span class="priority-badge p-medium">MEDIUM</span>
      <span class="tag tag-gameplay">Gameplay</span>
      <span class="tag tag-simplify">Simplify</span>
      <span class="effort-badge">Low effort</span>
    </div>
    <p>When all teams have submitted bids and the &ldquo;All Bids In!&rdquo; notification fires, offer the host a prominent &ldquo;All bids received &mdash; End Bidding Now?&rdquo; button (with a countdown). This reduces dead time when fast teams finish early. The host can still wait for the timer if they prefer.</p>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 5: LOW PRIORITY                           -->
  <!-- ═══════════════════════════════════════════════════ -->
  <h2 id="low-impact">5. Lower Priority &mdash; Nice-to-Have</h2>

  <div class="improvement-card">
    <h4>5.1 &nbsp; Export Results to PDF / CSV</h4>
    <div class="meta">
      <span class="priority-badge p-low">LOWER</span>
      <span class="tag tag-technical">Technical</span>
      <span class="effort-badge">Medium effort</span>
    </div>
    <p>Allow the host to export the full game results (leaderboard, per-round profits, clearing prices, dispatch data) as a downloadable PDF or CSV. Useful for corporate training teams who need to include game outcomes in workshop reports. The export API endpoint already exists (<code>/api/game/:id/export</code>) &mdash; just need a frontend button and formatted output.</p>
  </div>

  <div class="improvement-card">
    <h4>5.2 &nbsp; Team Avatar / Emoji Selection</h4>
    <div class="meta">
      <span class="priority-badge p-low">LOWER</span>
      <span class="tag tag-gameplay">Gameplay</span>
      <span class="effort-badge">Low effort</span>
    </div>
    <p>Let teams pick an emoji avatar when joining (&#9889; &#127793; &#128293; &#127754; etc). Shown next to their name on leaderboards and merit order charts. Adds personality and makes it easier to spot your team on the big screen.</p>
  </div>

  <div class="improvement-card">
    <h4>5.3 &nbsp; &ldquo;Explain This&rdquo; Tooltips on Key Concepts</h4>
    <div class="meta">
      <span class="priority-badge p-low">LOWER</span>
      <span class="tag tag-education">Education</span>
      <span class="tag tag-ui">UI</span>
      <span class="effort-badge">Medium effort</span>
    </div>
    <p>Add small (?) icons next to key terms throughout the UI (clearing price, merit order, marginal cost, infra-marginal profit, capacity factor, reserve margin). Tapping shows a 1&ndash;2 sentence explanation. Avoids the need to open full guides for a quick definition. This is especially helpful for non-native English speakers or participants unfamiliar with energy terminology.</p>
  </div>

  <div class="improvement-card">
    <h4>5.4 &nbsp; Dark Mode / Light Mode Toggle for Team Screen</h4>
    <div class="meta">
      <span class="priority-badge p-low">LOWER</span>
      <span class="tag tag-ui">UI</span>
      <span class="effort-badge">Medium effort</span>
    </div>
    <p>The team bidding screen uses a white background, which can be harsh in dimmed training rooms. Offer a dark mode toggle. The host dashboard and landing page already use dark themes &mdash; could unify the aesthetic.</p>
  </div>

  <div class="improvement-card">
    <h4>5.5 &nbsp; &ldquo;Replay Round&rdquo; Option for Host</h4>
    <div class="meta">
      <span class="priority-badge p-low">LOWER</span>
      <span class="tag tag-gameplay">Gameplay</span>
      <span class="effort-badge">Medium effort</span>
    </div>
    <p>Let the host replay the current round (same demand, same assets) with a button press. Useful when Round 1 was a mess because teams were learning the interface &mdash; &ldquo;Let&rsquo;s try that one again now that you understand how it works.&rdquo; Resets bids but keeps the same round config.</p>
  </div>

  <div class="improvement-card">
    <h4>5.6 &nbsp; Code Splitting for Faster Initial Load</h4>
    <div class="meta">
      <span class="priority-badge p-low">LOWER</span>
      <span class="tag tag-technical">Technical</span>
      <span class="effort-badge">Medium effort</span>
    </div>
    <p>The JS bundle is currently ~1.1 MB. Lazy-load the host dashboard, strategy guide, how-to-bid tutorial, and merit order walkthrough components using <code>React.lazy()</code>. The team bidding interface should load fastest since it&rsquo;s on mobile devices. Split the landing page educational content into a separate chunk.</p>
  </div>

  <div class="improvement-card">
    <h4>5.7 &nbsp; Spectator Mode</h4>
    <div class="meta">
      <span class="priority-badge p-idea">IDEA</span>
      <span class="tag tag-technical">Technical</span>
      <span class="tag tag-gameplay">Gameplay</span>
      <span class="effort-badge">Medium effort</span>
    </div>
    <p>Allow additional devices to connect as read-only spectators who see the host dashboard view. Useful for large rooms with multiple screens, or for remote participants observing a live session. Connect via <code>/spectate?game=XXXX</code>.</p>
  </div>

  <div class="improvement-card">
    <h4>5.8 &nbsp; Post-Game Summary Email / Report</h4>
    <div class="meta">
      <span class="priority-badge p-idea">IDEA</span>
      <span class="tag tag-technical">Technical</span>
      <span class="effort-badge">High effort</span>
    </div>
    <p>After the final round, generate a comprehensive game summary showing each team&rsquo;s journey: strategy evolution, best/worst rounds, total profit, how they compared to the market. Could be a printable HTML page (like the existing guides) generated from game state.</p>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 6: SIMPLIFICATION                         -->
  <!-- ═══════════════════════════════════════════════════ -->
  <h2 id="simplification">6. Simplification Ideas</h2>

  <p>These changes reduce cognitive load for participants, especially in one-off sessions where there&rsquo;s no time to &ldquo;figure it out.&rdquo;</p>

  <div class="improvement-card">
    <h4>6.1 &nbsp; &ldquo;Simple Bidding&rdquo; Mode &mdash; One Price Per Asset Per Period</h4>
    <div class="meta">
      <span class="priority-badge p-high">HIGH PRIORITY</span>
      <span class="tag tag-simplify">Simplify</span>
      <span class="tag tag-gameplay">Gameplay</span>
      <span class="effort-badge">High effort</span>
    </div>
    <p>The biggest complexity for new players is understanding bid bands. &ldquo;Why do I need to split my 800 MW coal into multiple bands at different prices?&rdquo; For early rounds, offer a mode where each asset has <strong>one bid: a single price for the full available MW</strong>. The game automatically bids the full capacity at that price.</p>
    <p>This reduces 7 assets &times; 4 periods &times; 3 bands = 84 inputs down to 7 &times; 4 = 28 inputs. Bid bands can be unlocked in later rounds once the concept is understood.</p>
    <div class="warning"><strong>Trade-off:</strong> Loses the teaching opportunity of &ldquo;splitting bids to be a price-maker&rdquo;. Could introduce bands explicitly in Round 4 or 5 with a teaching moment.</div>
  </div>

  <div class="improvement-card">
    <h4>6.2 &nbsp; Auto-Copy Bids Across Similar Periods</h4>
    <div class="meta">
      <span class="priority-badge p-medium">MEDIUM</span>
      <span class="tag tag-simplify">Simplify</span>
      <span class="tag tag-ui">UI</span>
      <span class="effort-badge">Low effort</span>
    </div>
    <p>Add a &ldquo;Copy bids to all periods&rdquo; button that takes the current period&rsquo;s bids and applies them to all other periods. Teams can then tweak individual periods. Eliminates the most tedious part of bidding &mdash; entering the same numbers four times. Could also offer &ldquo;Copy to similar periods&rdquo; (e.g., copy daytime bids to each other, copy nighttime bids to each other).</p>
  </div>

  <div class="improvement-card">
    <h4>6.3 &nbsp; Reduce Number of Time Periods in Early Rounds</h4>
    <div class="meta">
      <span class="priority-badge p-medium">MEDIUM</span>
      <span class="tag tag-simplify">Simplify</span>
      <span class="tag tag-gameplay">Gameplay</span>
      <span class="effort-badge">Low effort</span>
    </div>
    <p>Some game modes already do this (Beginner uses 2 periods, Quick Round 1 uses 2 periods). Ensure the Progressive Learning mode uses: Round 1 = 1 period, Round 2 = 2 periods, Round 3 = 4 periods. Fewer periods means fewer bids to enter and simpler results to interpret.</p>
  </div>

  <div class="improvement-card">
    <h4>6.4 &nbsp; Streamline the Bid Review Modal</h4>
    <div class="meta">
      <span class="priority-badge p-medium">MEDIUM</span>
      <span class="tag tag-simplify">Simplify</span>
      <span class="tag tag-ui">UI</span>
      <span class="effort-badge">Low effort</span>
    </div>
    <p>The current bid review modal shows all bids across all periods and all assets &mdash; it&rsquo;s thorough but can be overwhelming. For early rounds, show a simplified summary: total MW offered per period, average bid price, and any warnings. The detailed band-by-band view can remain available as a &ldquo;Show Details&rdquo; expandable section.</p>
  </div>

  <div class="improvement-card">
    <h4>6.5 &nbsp; Progressive UI Complexity &mdash; Reveal Features Over Rounds</h4>
    <div class="meta">
      <span class="priority-badge p-medium">MEDIUM</span>
      <span class="tag tag-simplify">Simplify</span>
      <span class="tag tag-ui">UI</span>
      <span class="effort-badge">Medium effort</span>
    </div>
    <p>Similar to how assets unlock over rounds, gradually reveal UI features:</p>
    <table>
      <tr><th>Round</th><th>Features Available</th></tr>
      <tr><td>1&ndash;2</td><td>Basic bid inputs, suggested bids, simple review</td></tr>
      <tr><td>3&ndash;4</td><td>+ Multiple bid bands, quick-bid shortcuts ($0, Marginal, $500)</td></tr>
      <tr><td>5+</td><td>+ Strategy auto-fill, help buttons bar, advanced review</td></tr>
      <tr><td>7+</td><td>+ Full complexity, all features unlocked</td></tr>
    </table>
    <p>This mirrors how video games introduce mechanics gradually. The configuration could be driven by the <code>roundConfig</code> with a <code>uiComplexity</code> level field.</p>
  </div>

  <div class="improvement-card">
    <h4>6.6 &nbsp; Preset Bid Templates for Quick Entry</h4>
    <div class="meta">
      <span class="priority-badge p-low">LOWER</span>
      <span class="tag tag-simplify">Simplify</span>
      <span class="tag tag-ui">UI</span>
      <span class="effort-badge">Low effort</span>
    </div>
    <p>Offer 3 one-tap preset templates per asset: &ldquo;Play it safe&rdquo; (bid near marginal cost), &ldquo;Go aggressive&rdquo; (bid 2&times; marginal cost), and &ldquo;Sit out&rdquo; (bid at market cap). These work alongside the existing strategy auto-fill but are simpler to understand &mdash; no need to choose a strategy name. Each template shows the resulting $/MWh value.</p>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 7: FACILITATION                           -->
  <!-- ═══════════════════════════════════════════════════ -->
  <h2 id="facilitation">7. Facilitation &amp; Smoothness Tips</h2>

  <p>These aren&rsquo;t code changes &mdash; they&rsquo;re process recommendations for making the overall game experience smoother.</p>

  <div class="card">
    <h3 style="margin-top: 0;">Before the Session</h3>
    <ul>
      <li><strong>Test the WiFi.</strong> Run the game with 2&ndash;3 test phones before participants arrive. Corporate networks often block WebSockets &mdash; find this out early, not during the session.</li>
      <li><strong>Print 1-page Quick Reference cards.</strong> A single sheet per team showing: asset marginal costs, bid band explanation, and time period descriptions. Reduces phone-switching between help guides and bidding.</li>
      <li><strong>Prepare a 3-minute verbal intro.</strong> Before even showing the game, explain the concept verbally: &ldquo;You own power stations. You bid the price you&rsquo;re willing to sell electricity at. Cheapest bids get dispatched first. The most expensive dispatched bid sets the price everyone gets paid.&rdquo; Then show the landing page &ldquo;Learn the NEM&rdquo; slides.</li>
      <li><strong>Have a backup plan for connectivity.</strong> If WiFi fails, the host can project team screens and run a single-device demo. Not ideal but salvages the session.</li>
    </ul>
  </div>

  <div class="card">
    <h3 style="margin-top: 0;">During the Session</h3>
    <ul>
      <li><strong>Walk the room during Round 1.</strong> Physically visit each team and check they understand the interface. This is more effective than explaining from the front.</li>
      <li><strong>Debrief every round, but keep it tight.</strong> Rounds 1&ndash;3: 3&ndash;5 minutes debrief each. Rounds 4+: 2&ndash;3 minutes. The merit order walkthrough is the star &mdash; project it big and narrate.</li>
      <li><strong>Create rivalry.</strong> Read out the leaderboard standings after every 2&ndash;3 rounds. Name names. &ldquo;Team Lightning is dominating with $45,000 profit. Can Team Thunder catch up?&rdquo;</li>
      <li><strong>Use the &ldquo;what to say&rdquo; prompts in the Game Master&rsquo;s Guide.</strong> They&rsquo;re specifically designed for pacing and highlighting key concepts at the right moment.</li>
      <li><strong>Don&rsquo;t explain everything upfront.</strong> Let the game teach. The heatwave round is designed to create a &ldquo;wow&rdquo; moment when prices spike &mdash; if you explain scarcity pricing before it happens, you lose that impact.</li>
      <li><strong>Embrace chaos in early rounds.</strong> If everyone bids $0 and the clearing price is $0, that&rsquo;s a teaching moment. &ldquo;What went wrong? Everyone was a price-taker. Who&rsquo;s going to bid differently next round?&rdquo;</li>
    </ul>
  </div>

  <div class="card">
    <h3 style="margin-top: 0;">After the Session</h3>
    <ul>
      <li><strong>Close with real-world connections.</strong> &ldquo;Everything you experienced today happens in the real NEM every 5 minutes. The heatwave round? That was January 2019. The negative prices? South Australia, spring 2024. The battery arbitrage? That&rsquo;s Hornsdale Power Reserve&rsquo;s business model.&rdquo;</li>
      <li><strong>Share the Player Pre-Read as a post-read.</strong> Participants retain more if they re-read the concepts after experiencing them in the game.</li>
      <li><strong>Capture the final leaderboard screenshot.</strong> Teams love sharing their rankings. It also serves as evidence for corporate training records.</li>
    </ul>
  </div>

  <div class="highlight">
    <strong>&#127919; The golden rule for one-off sessions:</strong> The game master matters more than the software. A skilled facilitator with a basic game creates better learning than a perfect game with a passive facilitator. Every improvement should either (a) make the game master&rsquo;s job easier, or (b) teach something the game master would otherwise need to explain verbally.
  </div>

  <div style="margin-top: 3rem; padding: 1.5rem; text-align: center; color: #718096; font-size: 0.85rem; border-top: 1px solid #e2e8f0;">
    <p>Watt Street &mdash; Recommended Further Improvements</p>
    <p>This document is a living roadmap. Priorities may shift based on user feedback and session outcomes.</p>
  </div>
</div>

</body>
</html>`;
}
