/**
 * Vibe Coding Notes — for lay audiences explaining how the game was built
 * Served at /api/notes/vibe-coding
 */
export function getVibeCodingNotesHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NEM Merit Order Game — How We "Vibe Coded" This Game with AI</title>
<style>
  @page { margin: 1.5cm 2cm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a202c; line-height: 1.8; font-size: 11pt; background: #f7fafc; }
  .container { max-width: 820px; margin: 0 auto; padding: 2rem 2rem 4rem; }
  .header { background: linear-gradient(135deg, #553c9a 0%, #1e3a5f 100%); color: white; padding: 2.5rem 2rem; border-radius: 12px; margin-bottom: 2rem; text-align: center; }
  .header h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: 0.3rem; }
  .header .subtitle { color: #d6bcfa; font-size: 1.05rem; }
  .header .date { color: #a0aec0; font-size: 0.85rem; margin-top: 0.5rem; }
  h2 { font-size: 1.4rem; color: #553c9a; border-bottom: 3px solid #805ad5; padding-bottom: 0.4rem; margin: 2rem 0 1rem; }
  h3 { font-size: 1.15rem; color: #2d3748; margin-top: 1.3rem; margin-bottom: 0.5rem; }
  p { margin-bottom: 0.8rem; }
  ul, ol { margin: 0.5rem 0 1rem 1.5rem; }
  li { margin-bottom: 0.4rem; }
  .card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.2rem 1.5rem; margin: 1rem 0; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .human { background: #faf5ff; border-left: 4px solid #805ad5; padding: 0.8rem 1rem; border-radius: 0 8px 8px 0; margin: 0.8rem 0; }
  .ai { background: #ebf8ff; border-left: 4px solid #3182ce; padding: 0.8rem 1rem; border-radius: 0 8px 8px 0; margin: 0.8rem 0; }
  .highlight { background: #f0fff4; border-left: 4px solid #38a169; padding: 0.8rem 1rem; border-radius: 0 8px 8px 0; margin: 0.8rem 0; }
  .callout { background: #fffbeb; border: 1px solid #f6e05e; border-radius: 10px; padding: 1.2rem 1.5rem; margin: 1rem 0; }
  .quote { font-style: italic; color: #4a5568; border-left: 3px solid #cbd5e0; padding-left: 1rem; margin: 1rem 0; }
  .timeline { position: relative; padding-left: 2rem; }
  .timeline::before { content: ''; position: absolute; left: 0.5rem; top: 0; bottom: 0; width: 3px; background: #805ad5; border-radius: 2px; }
  .timeline-item { position: relative; margin-bottom: 1.5rem; }
  .timeline-item::before { content: ''; position: absolute; left: -1.75rem; top: 0.5rem; width: 12px; height: 12px; background: #805ad5; border-radius: 50%; border: 2px solid white; }
  .timeline-item h3 { margin-top: 0; }
  .badge { display: inline-block; font-size: 0.75rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 20px; color: white; }
  .badge-purple { background: #805ad5; }
  .badge-blue { background: #3182ce; }
  .back-link { display: inline-block; margin-bottom: 1rem; color: #805ad5; text-decoration: none; font-weight: 600; }
  .back-link:hover { text-decoration: underline; }
  .print-btn { display: inline-block; background: #805ad5; color: white; border: none; padding: 0.5rem 1.2rem; border-radius: 8px; font-size: 0.9rem; cursor: pointer; text-decoration: none; margin-left: 0.5rem; }
  .print-btn:hover { background: #6b46c1; }
  .split { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  @media (max-width: 700px) { .split { grid-template-columns: 1fr; } }
  @media print { .no-print { display: none !important; } body { background: white; } .container { padding: 0; } }
</style>
</head>
<body>
<div class="container">
  <div class="no-print" style="display: flex; justify-content: space-between; align-items: center;">
    <a href="/" class="back-link">&larr; Back to Game</a>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="header">
    <h1>How We "Vibe Coded" This Game with AI</h1>
    <div class="subtitle">A non-technical guide to building software with artificial intelligence</div>
    <div class="date">February 2026</div>
  </div>

  <h2>What is "Vibe Coding"?</h2>
  <div class="card">
    <p><strong>Vibe coding</strong> is a new way of building software where a person describes what they want in plain English, and an AI assistant writes all the actual computer code. The human provides the <em>vision, ideas, and feedback</em>. The AI provides the <em>technical execution</em>.</p>
    <p>Think of it like being an architect who sketches a building design, while a highly skilled builder interprets the sketches and does all the construction&mdash;choosing the right materials, calculating structural loads, and laying every brick. Except this builder works at superhuman speed and never needs a tea break.</p>
    <p>The term was coined in early 2025 and has since become a widespread approach to building applications quickly. It does not mean the human has zero skill or involvement&mdash;it means the human focuses on <em>what</em> to build and <em>why</em>, while the AI handles <em>how</em>.</p>
  </div>

  <h2>The Tools We Used</h2>
  <div class="card">
    <h3>Claude Code (by Anthropic)</h3>
    <p>The AI assistant that wrote this game is called <strong>Claude</strong>, made by a company called <strong>Anthropic</strong>. Specifically, we used <strong>Claude Code</strong>&mdash;a version of Claude that runs in a computer terminal and can directly create, edit, and manage files on your computer.</p>
    <p>Claude Code can:</p>
    <ul>
      <li>Write code in any programming language</li>
      <li>Create entire applications from a description</li>
      <li>Read and understand existing code</li>
      <li>Search the internet for current information</li>
      <li>Run commands to test and start applications</li>
      <li>Fix bugs and improve code based on feedback</li>
    </ul>
    <p>The specific AI model used was <strong>Claude Opus 4.6</strong>&mdash;Anthropic's most capable model as of early 2026.</p>
  </div>

  <h2>What the Human Provided vs What the AI Did</h2>

  <div class="split">
    <div class="card" style="border-top: 4px solid #805ad5;">
      <h3 style="color: #805ad5;">The Human's Role</h3>
      <p>The human user provided:</p>
      <ul>
        <li><strong>The core idea:</strong> "Build a game that simulates the NEM merit order dispatch"</li>
        <li><strong>Domain knowledge:</strong> Understanding of how Australia's electricity market works, what assets exist (coal, gas, wind, solar, hydro, batteries), and what the game should teach</li>
        <li><strong>Design direction:</strong> Requests for specific visual styles (dark theme, Bloomberg/trading floor aesthetic), cinematic transitions, and sound effects</li>
        <li><strong>Gameplay decisions:</strong> How many teams, what game modes, what scenarios to include, what the market price cap should be ($20,000/MWh, matching real NEM rules)</li>
        <li><strong>Quality feedback:</strong> Testing the game, identifying bugs ("the $0 is not displaying correctly"), requesting improvements ("add exit buttons, we need a way to leave the game")</li>
        <li><strong>Real-world validation:</strong> Ensuring the game mechanics match actual NEM operations</li>
      </ul>
    </div>
    <div class="card" style="border-top: 4px solid #3182ce;">
      <h3 style="color: #3182ce;">The AI's Role</h3>
      <p>Claude handled all the technical work:</p>
      <ul>
        <li><strong>Architecture design:</strong> Chose the right software components (React, Node.js, Socket.IO, etc.) and how they fit together</li>
        <li><strong>All code writing:</strong> ~22,000+ lines of TypeScript/JavaScript across ~70+ files</li>
        <li><strong>Algorithm implementation:</strong> Built the merit order dispatch algorithm, profit calculations, demand curve generation</li>
        <li><strong>Real-time networking:</strong> Set up WebSocket communication so all players see updates instantly</li>
        <li><strong>Visual design:</strong> Created animations, charts, responsive layouts, and the landing page visual effects</li>
        <li><strong>Sound design:</strong> Built a procedural audio engine that synthesises all sound effects in real time using mathematical waveforms (no audio files needed)</li>
        <li><strong>Bug fixing:</strong> Diagnosed and fixed issues as they were reported</li>
        <li><strong>Documentation:</strong> Created the player pre-read, game guide, and these very notes</li>
      </ul>
    </div>
  </div>

  <h2>The Development Story: How It Actually Happened</h2>
  <p>The entire game was built across <strong>11+ conversation sessions</strong> over 7 days, with <strong>~160+ human prompts</strong> in total. Here is how it unfolded:</p>

  <div class="timeline">
    <div class="timeline-item">
      <h3>Phase 1: The Big Bang <span class="badge badge-blue">28 prompts &middot; Session 1</span></h3>
      <p><span class="badge badge-purple">Friday &ndash; Saturday</span> The user described the concept in a single, detailed opening prompt&mdash;over 500 words long&mdash;covering game modes, asset types, bidding mechanics, demand curves, seasonal scenarios, and output requirements.</p>
      <div class="human"><strong>Actual opening prompt (excerpt):</strong> &ldquo;I would like to build an app which can be used to run a training program for people who work in the energy industry to better understand the NEM merit order mechanism. To do this I would like to create a relatively simple game, that enables up to 15 teams to play the role of an energy company&hellip;&rdquo;</div>
      <div class="ai"><strong>What Claude did:</strong> Within a single conversation, Claude designed the entire application architecture, created 59 files, and wrote over 15,000 lines of code. This included the game engine, the merit order algorithm, the user interfaces for hosts and teams, real-time WebSocket communication, data visualisation charts, a QR code joining system, and an animated landing page. The game was playable at the end of this first session.</div>
      <div class="highlight"><strong>Key insight:</strong> Claude drew on its training knowledge of electricity markets, the Australian NEM specifically, software architecture patterns, and dozens of web technologies to build a complete working system from a high-level description. No line-by-line coding instructions were needed.</div>
      <p style="margin-top: 0.8rem;"><strong>Other prompts in this phase included:</strong></p>
      <ul style="font-size: 0.9rem; color: #4a5568;">
        <li>&ldquo;when using my phone I was able to connect but then when my phone went on standby it lost connection and I couldn&rsquo;t reconnect&rdquo;</li>
        <li>&ldquo;can you please add Bidding strategy pre-fill buttons on team page&rdquo;</li>
        <li>&ldquo;each round needs a descriptor of the demand and supply balance&rdquo;</li>
        <li>&ldquo;can you make the opening screen more exciting. Can you add music?&rdquo;</li>
        <li>&ldquo;create a pre-read pdf that can be sent to players the week before they play&rdquo;</li>
      </ul>
    </div>

    <div class="timeline-item">
      <h3>Phase 2: Testing and Hardening <span class="badge badge-blue">26 prompts &middot; Sessions 2&ndash;3</span></h3>
      <p><span class="badge badge-purple">Saturday morning</span> The user tested the game with a colleague and reported real-world issues.</p>
      <div class="human"><strong>What the human said (examples):</strong></div>
      <ul style="font-size: 0.9rem; color: #4a5568;">
        <li>&ldquo;the server crashes sometimes&rdquo;</li>
        <li>&ldquo;the $0 is not showing in bids&rdquo;</li>
        <li>&ldquo;the connections drop on mobile hotspot&rdquo;</li>
        <li>&ldquo;need a beginner mode for people who don&rsquo;t know the NEM&rdquo;</li>
        <li>&ldquo;make the SRMC badges bigger and more prominent&rdquo;</li>
        <li>&ldquo;demand should be an average 50&ndash;90% of capacity&rdquo;</li>
        <li>&ldquo;create an overview dashboard for the game master of each generator, broken down by asset type&rdquo;</li>
        <li>&ldquo;can you make a super simplified version, which has only one round two assets, just for beginners?&rdquo;</li>
      </ul>
      <div class="ai"><strong>What Claude did:</strong> Added global error handlers to prevent server crashes, fixed the display bug, relaxed network timeout settings for poor WiFi connections, created a new Beginner game mode with only 2 asset types and a guided walkthrough, rewrote demand generation to target 50&ndash;95% of fleet capacity, built a dispatch overview dashboard, and improved various UI elements.</div>
      <div class="highlight"><strong>Key insight:</strong> The human didn't need to know <em>how</em> to fix a server crash or a display bug. They just reported what was wrong, and Claude diagnosed the root cause and implemented the fix.</div>
    </div>

    <div class="timeline-item">
      <h3>Phase 3: Making It Educational <span class="badge badge-blue">10 prompts &middot; Sessions 4&ndash;5</span></h3>
      <p><span class="badge badge-purple">Saturday afternoon</span> The user wanted features that would help players learn, not just play.</p>
      <div class="human"><strong>What the human said (examples):</strong></div>
      <ul style="font-size: 0.9rem; color: #4a5568;">
        <li>&ldquo;at the end of each round, create a walkthrough which shows how the merit order dispatch was built up&rdquo;</li>
        <li>&ldquo;instead of submitting bids, the button should be review bids&rdquo; with warnings for zero-MW and below-SRMC bids</li>
        <li>&ldquo;the host should have a button to view what is being shown to each of the teams&rdquo;</li>
        <li>&ldquo;at the end of the game, there is no way to start again and go back to the main page&rdquo;</li>
        <li>&ldquo;the walkthrough is great, but when someone bids zero you need to be able to see the bid&rdquo;</li>
      </ul>
      <div class="ai"><strong>What Claude did:</strong> Built an animated merit order walkthrough that visually steps through the dispatch process, created a bid review modal that warns about common mistakes (bidding below cost, zero-MW bids), added a host team view feature, and added exit buttons throughout the application.</div>
    </div>

    <div class="timeline-item">
      <h3>Phase 4: Making It Theatrical <span class="badge badge-blue">29 prompts &middot; Session 6</span></h3>
      <p><span class="badge badge-purple">Saturday evening</span> The user wanted the game to feel like an event, not just a web page. This was also the session with the infamous transition loop bug.</p>
      <div class="human"><strong>What the human said (examples):</strong></div>
      <ul style="font-size: 0.9rem; color: #4a5568;">
        <li>&ldquo;create a nice dramatic transition slide for when the game is selected&rdquo;</li>
        <li>&ldquo;can you add some appropriate audio to the transitions?&rdquo;</li>
        <li>&ldquo;the transition slide for round 1 got stuck in a loop&rdquo;</li>
        <li>&ldquo;the loop is still there&rdquo; (reported <strong>8 times</strong> across 45 minutes)</li>
        <li>&ldquo;I think the problem is I don&rsquo;t know how to explain it to you clearly&rdquo;</li>
        <li>[Installed Claude Chrome Extension so the AI could <em>see</em> the bug visually]</li>
        <li>&ldquo;add a bidding guardrail toggle&rdquo; and &ldquo;call out SRMC as its full name, not an acronym&rdquo;</li>
      </ul>
      <div class="ai"><strong>What Claude did:</strong> Created a &ldquo;MARKET OPEN&rdquo; cinematic sequence with visual effects and built an entire procedural audio engine from scratch. Rather than using pre-recorded sound files, Claude wrote code that generates sounds using mathematical waveforms&mdash;buzzes, chimes, whooshes, and zaps&mdash;all synthesised in real time by the browser. After struggling to diagnose the transition loop bug through text descriptions alone, the Claude Chrome Extension allowed the AI to observe the bug visually, identify the root cause (a state update triggering a re-render loop), and fix it.</div>
      <div class="highlight"><strong>Key insight:</strong> This phase perfectly illustrates both the power and the limits of vibe coding. The human said &ldquo;make it sound dramatic&rdquo; and Claude independently built a procedural audio engine using the Web Audio API. But when a visual bug appeared, 8 rounds of &ldquo;the loop is still there&rdquo; couldn&rsquo;t convey what 5 seconds of screen observation could. The Chrome Extension bridged that gap.</div>
    </div>

    <div class="timeline-item">
      <h3>Phase 5: Polish and Customisation <span class="badge badge-blue">21 prompts &middot; Sessions 7&ndash;8</span></h3>
      <p><span class="badge badge-purple">Saturday night &ndash; Sunday morning</span> The user wanted customisation, documentation, and final polish.</p>
      <div class="human"><strong>What the human said (examples):</strong></div>
      <ul style="font-size: 0.9rem; color: #4a5568;">
        <li>&ldquo;make it so the key parameters of the game are editable&mdash;the names and SRMC for each plant&rdquo;</li>
        <li>&ldquo;make the dispatch overview have the same type of graphic as the walkthrough&rdquo;</li>
        <li>&ldquo;make the scrolling sidebar a little larger, I find it hard to grab&rdquo;</li>
        <li>&ldquo;prepare some notes regarding how it has been developed&rdquo; (IT notes and vibe coding notes)</li>
        <li>&ldquo;when you end a game and try to start another, the QR code does not appear&rdquo;</li>
        <li>&ldquo;let me toggle through the other options on the left hand side while bidding is in progress&rdquo;</li>
      </ul>
      <div class="ai"><strong>What Claude did:</strong> Built a complete asset configuration editor (save/load presets), renamed &ldquo;SRMC&rdquo; to &ldquo;Marginal Cost&rdquo; across all code and user-facing content, rewrote the transition animations from a library-based approach to pure CSS for better reliability, created technical and vibe coding documentation, fixed the QR code bug through socket room management, and added various quality-of-life improvements.</div>
    </div>

    <div class="timeline-item">
      <h3>Phase 6: Final Refinements <span class="badge badge-blue">13 prompts &middot; Session 9</span></h3>
      <p><span class="badge badge-purple">Tuesday</span> Final bug fixes, mobile UX improvements, and documentation updates.</p>
      <div class="human"><strong>What the human said (examples):</strong></div>
      <ul style="font-size: 0.9rem; color: #4a5568;">
        <li>&ldquo;the QR code for the next game seems to disappear&rdquo; (deeper fix for socket room cleanup)</li>
        <li>&ldquo;make the Learn the NEM, Player Pre-Read, and Download Guide all downloadable as PDF&rdquo;</li>
        <li>&ldquo;put a comma for every thousand to make dollar amounts clearer&rdquo;</li>
        <li>&ldquo;on an iPhone, the cursor defaults to being after the 0 rather than before it&rdquo;</li>
        <li>&ldquo;make sure the guardrails don&rsquo;t put users in a doom loop where they can&rsquo;t submit a bid&rdquo;</li>
        <li>&ldquo;add the guardrails table into the game guide&rdquo;</li>
      </ul>
      <div class="ai"><strong>What Claude did:</strong> Deep-dived into socket room management to permanently fix the QR code bug, added PDF download capability using browser print dialogs, improved currency formatting with comma separators, added mobile-friendly input selection, relaxed bidding restrictions when guardrails are disabled, and updated documentation.</div>
    </div>

    <div class="timeline-item">
      <h3>Phase 7: Advanced Game Mechanics &amp; Documentation <span class="badge badge-blue">30+ prompts &middot; Sessions 10&ndash;11</span></h3>
      <p><span class="badge badge-purple">Wednesday &ndash; Thursday</span> The user wanted deeper gameplay mechanics, better onboarding for new players, and comprehensive documentation for game masters and future improvements.</p>
      <div class="human"><strong>What the human said (examples):</strong></div>
      <ul style="font-size: 0.9rem; color: #4a5568;">
        <li>&ldquo;Can you add buttons to the teams bidding page so that they can access the Bid explainer and the Round explainer and the strategy explainer&rdquo;</li>
        <li>&ldquo;Can you update the round briefing to include when a surprise event was called &mdash; mimicking real life where something happens but you&rsquo;re not sure why&rdquo;</li>
        <li>&ldquo;Can you give me a written plan detailing further improvements that could be made to the game prioritised into desirability/impact&rdquo;</li>
      </ul>
      <div class="ai"><strong>What Claude did:</strong> This was a major expansion phase. Claude built an entire <strong>Surprise Events system</strong>&mdash;6 host-triggered secret disruptions (Generator Trip, Demand Surge, Demand Drop/Solar, Renewable Drought, Fuel Price Spike, Interconnector Outage) that the game master can toggle during the briefing phase. When active, teams see dramatic &ldquo;Developing Situation&rdquo; incident reports with deliberately vague descriptions, mimicking the real-world uncertainty that energy traders face. Claude also built a <strong>full-screen cinematic Round Briefing</strong> slide deck (season overview, demand profiles, fleet capacity, scenario events, and incident reports), a <strong>6-slide Strategy Guide</strong> covering bidding approaches (Price Taker, Marginal Cost, Price Maker, Portfolio Optimizer, Strategic Withdrawal, Battery Arbitrageur) with mock examples and game theory, a <strong>How to Bid tutorial</strong> for first-time players, <strong>quick-access help buttons</strong> during bidding, a <strong>Common Mistakes reference</strong> drawn from the Game Master&rsquo;s Guide, and a comprehensive <strong>Recommended Improvements document</strong> proposing a new &ldquo;Progressive Learning&rdquo; 10-round game mode. The Game Master&rsquo;s Guide was also updated with surprise event documentation and facilitation notes.</div>
      <div class="highlight"><strong>Key insight:</strong> This phase shows how vibe coding enables a domain expert to rapidly layer sophisticated game mechanics on top of a working product. Features like the surprise events system&mdash;which required changes to game state, host controls, team UI, round briefing presentations, and the dispatch engine&mdash;would typically need a multi-sprint planning effort. Here, each feature went from idea to working implementation in a single conversation exchange.</div>
    </div>
  </div>

  <h2>The Prompts: What the Human Actually Said</h2>
  <div class="card">
    <p>Across all 11+ sessions, the human sent <strong>~160+ prompts</strong>. These ranged from a 500-word opening brief to single-word continuations like &ldquo;yes&rdquo; and &ldquo;continue.&rdquo; Here is how they break down by category:</p>

    <div class="split" style="margin-top: 1rem;">
      <div>
        <h3 style="color: #805ad5;">Feature Requests (~50 prompts, 31%)</h3>
        <p style="font-size: 0.9rem;">New features and capabilities, described in plain English:</p>
        <ul style="font-size: 0.85rem;">
          <li>Game concept and structure (initial 500-word brief)</li>
          <li>Bidding strategies and pre-fill buttons</li>
          <li>Merit order walkthrough animation</li>
          <li>Cinematic transitions and sound effects</li>
          <li>Bid review modal with warnings</li>
          <li>Asset configuration editor</li>
          <li>Host team view and dispatch overview</li>
          <li>Beginner mode</li>
          <li>PDF downloads for all resources</li>
          <li>Bidding guardrails</li>
          <li>Surprise events system (6 disruptions)</li>
          <li>Strategy guide, how-to-bid tutorial, help buttons</li>
          <li>Round briefing presentations</li>
          <li>Recommended improvements roadmap</li>
        </ul>
      </div>
      <div>
        <h3 style="color: #e53e3e;">Bug Reports (~20 prompts, 12%)</h3>
        <p style="font-size: 0.9rem;">Issues discovered through testing:</p>
        <ul style="font-size: 0.85rem;">
          <li>&ldquo;$0 is not showing in bids&rdquo;</li>
          <li>&ldquo;phone lost connection on standby&rdquo;</li>
          <li>&ldquo;server crashes sometimes&rdquo;</li>
          <li>&ldquo;transition slide stuck in a loop&rdquo; (&times;8)</li>
          <li>&ldquo;QR code disappears on second game&rdquo;</li>
          <li>&ldquo;iPhone cursor after the 0&rdquo;</li>
          <li>&ldquo;exit takes you back to lobby, not setup&rdquo;</li>
        </ul>
      </div>
    </div>
    <div class="split" style="margin-top: 1rem;">
      <div>
        <h3 style="color: #3182ce;">UI/UX Improvements (~30 prompts, 19%)</h3>
        <p style="font-size: 0.9rem;">Visual and usability refinements:</p>
        <ul style="font-size: 0.85rem;">
          <li>&ldquo;make the SRMC badges bigger&rdquo;</li>
          <li>&ldquo;put demand at the top of the bidding screen&rdquo;</li>
          <li>&ldquo;add commas in dollar amounts&rdquo;</li>
          <li>&ldquo;call out SRMC as its full name&rdquo;</li>
          <li>&ldquo;make the scrollbar a little larger&rdquo;</li>
          <li>&ldquo;make the opening screen more exciting&rdquo;</li>
          <li>&ldquo;add help buttons during bidding&rdquo;</li>
          <li>&ldquo;incident reports should feel dramatic&rdquo;</li>
        </ul>
      </div>
      <div>
        <h3 style="color: #718096;">Operational (~60 prompts, 38%)</h3>
        <p style="font-size: 0.9rem;">Server management, git, and session continuations:</p>
        <ul style="font-size: 0.85rem;">
          <li>&ldquo;give me a link to click to start&rdquo; (&times;8)</li>
          <li>&ldquo;please restart the server&rdquo; (&times;7)</li>
          <li>&ldquo;commit the changes to git&rdquo; (&times;5)</li>
          <li>&ldquo;please continue&rdquo; / &ldquo;tokens reset&rdquo; (&times;12)</li>
          <li>&ldquo;how many tokens do I have left?&rdquo;</li>
          <li>&ldquo;how do I open my previous work?&rdquo;</li>
          <li>&ldquo;I&rsquo;m going to turn off the computer&rdquo;</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="callout" style="margin-top: 1.5rem;">
    <p><strong>What&rsquo;s striking:</strong> Only <strong>31%</strong> of prompts were feature requests&mdash;the creative, directional input. Another <strong>12%</strong> were bug reports. The remaining <strong>57%</strong> were operational (server restarts, git commits, session management) and UI tweaks. This reveals the reality of vibe coding: the human spends as much time <em>managing the process</em> as they do <em>directing the product</em>.</p>
  </div>

  <h2>What Did Claude Already Know?</h2>
  <div class="card">
    <p>Claude's AI model was trained on a vast body of text from the internet and books, which means it already "knew" many things that were essential for building this game. Here are some examples:</p>

    <h3>Electricity Market Knowledge</h3>
    <ul>
      <li>How merit order dispatch works (sorting generators by cost, dispatching cheapest first)</li>
      <li>The concept of a clearing price (the last dispatched generator sets the price for all)</li>
      <li>Types of generation assets in the NEM and their approximate costs</li>
      <li>What scenarios affect electricity markets (heatwaves increasing demand, droughts reducing hydro, etc.)</li>
      <li>Market rules like price caps, negative pricing, and startup costs</li>
    </ul>

    <h3>Software Engineering Knowledge</h3>
    <ul>
      <li>How to build real-time multiplayer web applications</li>
      <li>How to create data visualisations (charts, graphs)</li>
      <li>How to make responsive designs that work on phones and desktops</li>
      <li>How to generate QR codes, create animations, and synthesise audio</li>
      <li>Best practices for error handling, network resilience, and application architecture</li>
    </ul>

    <h3>Game Design Knowledge</h3>
    <ul>
      <li>How to structure a turn-based multiplayer game with bidding mechanics</li>
      <li>How to create progressive difficulty (beginner through to expert modes)</li>
      <li>How to provide feedback that teaches rather than just scores</li>
      <li>How to make interfaces intuitive for mobile users</li>
    </ul>
  </div>

  <h2>The Numbers</h2>
  <div class="card">
    <div class="split">
      <div>
        <h3>Scale of Work</h3>
        <ul>
          <li><strong>~22,000+ lines of code</strong> written</li>
          <li><strong>~70+ files</strong> created</li>
          <li><strong>10+ major versions</strong> committed to git</li>
          <li><strong>~7 days</strong> elapsed, ~30 hours active</li>
          <li><strong>7 asset types</strong> with realistic parameters</li>
          <li><strong>16+ scenario events</strong> (including 6 surprise events)</li>
          <li><strong>4 game modes</strong></li>
        </ul>
      </div>
      <div>
        <h3>Human Input</h3>
        <ul>
          <li><strong>~160+ prompts</strong> across 11+ conversation sessions</li>
          <li><strong>~50+ feature requests</strong> (31%)</li>
          <li><strong>~20 bug reports</strong> (12%)</li>
          <li><strong>~30 UI/UX improvements</strong> (19%)</li>
          <li><strong>~60 operational prompts</strong> (38%): server restarts, git commits, session continuations</li>
          <li>Longest prompt: <strong>~500 words</strong> (opening game concept)</li>
          <li>Shortest prompt: <strong>1 word</strong> (&ldquo;continue&rdquo;, &ldquo;yes&rdquo;, &ldquo;both&rdquo;)</li>
        </ul>
      </div>
    </div>
    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
      <h3>What Would This Normally Take?</h3>
      <p>Let us compare the vibe coding approach with what a traditional corporate IT project would realistically look like for the same deliverable.</p>

      <div class="split" style="margin-top: 1rem;">
        <div class="card" style="border-top: 4px solid #38a169; margin: 0;">
          <h3 style="color: #38a169; margin-top: 0;">Vibe Coding Approach</h3>
          <ul>
            <li><strong>Team:</strong> 1 person (domain expert + AI)</li>
            <li><strong>Elapsed time:</strong> ~7 days</li>
            <li><strong>Active work:</strong> ~30 hours</li>
            <li><strong>Tooling cost:</strong> Claude Code subscription ~$200/month</li>
            <li><strong>Total cost:</strong> ~$200 + the person&rsquo;s time</li>
          </ul>
          <p style="font-size: 0.9rem; margin-top: 0.8rem; color: #4a5568;">The person described features in plain English, tested the game, reported bugs, and provided domain expertise. Claude wrote all 22,000+ lines of code, designed the architecture, created the UI, built the audio engine, and produced all documentation.</p>
        </div>

        <div class="card" style="border-top: 4px solid #e53e3e; margin: 0;">
          <h3 style="color: #e53e3e; margin-top: 0;">Traditional Corporate IT Approach</h3>
          <p style="font-size: 0.9rem;"><strong>Team required (minimum):</strong></p>
          <ul style="font-size: 0.85rem;">
            <li>1&times; Project Manager / BA &mdash; $1,400&ndash;1,800/day</li>
            <li>1&times; UX/UI Designer &mdash; $1,200&ndash;1,600/day</li>
            <li>2&times; Senior Full-Stack Developers &mdash; $1,400&ndash;1,800/day each</li>
            <li>1&times; QA/Test Engineer &mdash; $1,000&ndash;1,400/day</li>
            <li>1&times; Subject Matter Expert (0.3 FTE) &mdash; $1,200&ndash;1,600/day</li>
            <li>1&times; DevOps / Infrastructure (0.2 FTE) &mdash; $1,200&ndash;1,600/day</li>
          </ul>
        </div>
      </div>

      <div class="card" style="margin-top: 1rem;">
        <h3 style="margin-top: 0;">Traditional Timeline (realistic corporate)</h3>
        <div class="split">
          <div>
            <ul style="font-size: 0.9rem;">
              <li><strong>Weeks 1&ndash;2:</strong> Requirements gathering, stakeholder alignment, design sprints</li>
              <li><strong>Weeks 3&ndash;4:</strong> Architecture design, tech stack selection, environment setup</li>
              <li><strong>Weeks 5&ndash;8:</strong> Core development (game engine, UI, real-time networking)</li>
            </ul>
          </div>
          <div>
            <ul style="font-size: 0.9rem;">
              <li><strong>Weeks 9&ndash;10:</strong> Integration, testing, user acceptance testing</li>
              <li><strong>Weeks 11&ndash;12:</strong> Bug fixes, polish, deployment, documentation</li>
              <li><strong>Total: 10&ndash;12 weeks</strong></li>
            </ul>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: 1rem; border-left: 4px solid #e53e3e;">
        <h3 style="margin-top: 0; color: #e53e3e;">Traditional Cost Estimate</h3>
        <ul style="font-size: 0.9rem;">
          <li><strong>Core team</strong> (PM + Designer + 2 Devs + QA): ~5 people &times; 12 weeks &times; 5 days &times; $1,400 avg = <strong>~$420,000</strong></li>
          <li><strong>Part-time specialists</strong> (SME at 0.3 FTE + DevOps at 0.2 FTE): <strong>~$50,000</strong></li>
          <li><strong>Corporate overhead</strong> (meetings, approvals, change requests, procurement): <strong>+30&ndash;50%</strong></li>
          <li><strong>Infrastructure and tooling</strong> (cloud environments, CI/CD, licences): <strong>~$5,000&ndash;10,000</strong></li>
        </ul>
        <p style="font-size: 1.1rem; font-weight: 700; color: #e53e3e; margin-top: 0.8rem; text-align: center;">Estimated total: $500,000 &ndash; $750,000</p>
      </div>

      <div class="callout" style="margin-top: 1rem;">
        <p><strong>And even then:</strong></p>
        <ul style="font-size: 0.9rem;">
          <li>No guarantee of the same creative iteration speed &mdash; features that took minutes in vibe coding would take days through sprint cycles</li>
          <li>Requirements would need to be locked much earlier &mdash; the organic discovery process (&ldquo;what if we added surprise events?&rdquo;) does not fit neatly into a waterfall or even an agile process</li>
          <li>Change requests mid-development are expensive &mdash; each new idea goes through estimation, prioritisation, and replanning</li>
          <li>The &ldquo;vibe&rdquo; &mdash; the rapid creative back-and-forth where ideas become working features in minutes &mdash; would be replaced by sprint planning, Jira tickets, and fortnightly demos</li>
        </ul>
      </div>

      <div class="highlight" style="margin-top: 1rem;">
        <p style="font-size: 0.9rem;"><strong>A note on the traditional estimate:</strong> The $500,000&ndash;$750,000 figure may seem high, but consider: corporate IT projects routinely involve procurement processes, security reviews, architectural review boards, multiple environments (dev/staging/prod), accessibility compliance, and documentation requirements that simply do not apply to a weekend vibe-coding session. In many large organisations, even getting a new project approved and a team assembled can take 4&ndash;6 weeks before any code is written.</p>
      </div>

      <p style="margin-top: 1rem;">The vibe coding approach reduced this to <strong>one person + AI over about a week, using ~160 plain-English prompts and a $200 subscription</strong>.</p>
    </div>
  </div>

  <h2>Common Questions</h2>

  <div class="card">
    <h3>Does the human need to know how to code?</h3>
    <p>Not necessarily, though it helps. In this case, the human had domain expertise in electricity markets and a general understanding of how software works, but did not write any of the code. The prompts were given in plain English&mdash;things like "add exit buttons" and "make the transitions more cinematic." Claude interpreted these instructions and made all the technical decisions.</p>
  </div>

  <div class="card">
    <h3>Is the code any good?</h3>
    <p>The code is written in TypeScript (a type-safe version of JavaScript), follows modern best practices, uses well-established open-source libraries, and includes error handling and network resilience features. It is structured in a way that would be familiar and maintainable to any professional developer. The architecture separates concerns cleanly: game logic is on the server, presentation is on the client, and shared types ensure consistency between both.</p>
  </div>

  <div class="card">
    <h3>Could this game be modified or extended?</h3>
    <p>Yes. Because the code is well-structured and uses standard technologies, any developer with JavaScript/TypeScript experience could modify it. Alternatively, the same vibe coding approach could be used&mdash;describe the changes you want to Claude and it will implement them. The game's data files (asset definitions, scenarios, demand profiles) are separated from the game logic, making it easy to adjust game parameters without touching the core code.</p>
  </div>

  <div class="card">
    <h3>What are the limitations of vibe coding?</h3>
    <ul>
      <li><strong>You need clear ideas.</strong> The AI is excellent at execution, but it needs direction. Vague requests produce vague results. Specific, well-thought-out requests produce impressive results.</li>
      <li><strong>Testing is still essential.</strong> AI-generated code can have bugs, just like human-written code. The iterative testing and feedback cycle (Phase 2) was crucial.</li>
      <li><strong>Domain expertise matters.</strong> Without the human's knowledge of the NEM, the game might have been technically impressive but factually wrong. The human validated that the game mechanics matched real market operations.</li>
      <li><strong>Complex debugging can be tricky.</strong> When something goes wrong, explaining the problem to the AI sometimes takes more effort than explaining what you want built. In one case, a cinematic transition between game phases was getting stuck in an infinite loop. Describing the visual bug in text wasn&rsquo;t enough for the AI to diagnose it. The solution was to use the <strong>Claude Chrome Extension</strong>&mdash;a browser plugin that lets Claude actually <em>see</em> what&rsquo;s on screen, read the live DOM, and inspect the running application in real time. Once Claude could observe the transition loop happening visually, it identified the root cause (a state update triggering a re-render that re-triggered the transition) and fixed it within minutes. This highlights an important lesson: some bugs are inherently <em>visual</em> and need to be seen, not just described.</li>
    </ul>
  </div>

  <div class="card">
    <h3>Is this the future of software development?</h3>
    <p>Vibe coding is rapidly becoming a mainstream approach for building applications, especially prototypes, internal tools, and educational software. It dramatically lowers the barrier to entry for software creation and compresses development timelines from weeks to hours. However, large-scale enterprise systems, safety-critical software, and highly regulated environments will likely continue to require traditional development practices with extensive testing, code review, and quality assurance for the foreseeable future.</p>
    <p>What is clear is that AI-assisted development&mdash;whether through vibe coding or more traditional AI pair-programming&mdash;is becoming a standard tool in every developer's toolkit.</p>
  </div>

  <h2>The Takeaway</h2>
  <div class="callout">
    <p>This game was built by a <strong>collaboration between human vision and AI capability</strong>. The human knew what the NEM is, how it works, and what the game should teach. The AI knew how to build a real-time multiplayer web application, create data visualisations, synthesise audio, and structure 22,000+ lines of code into a maintainable architecture. Neither could have built this alone in the time available.</p>
    <p style="margin-top: 0.8rem;">That is the power of vibe coding: <strong>ideas become software at the speed of conversation</strong>.</p>
  </div>

  <div style="margin-top: 3rem; padding: 1.5rem; text-align: center; color: #718096; font-size: 0.85rem; border-top: 1px solid #e2e8f0;">
    <p>NEM Merit Order Training Game &mdash; Vibe Coding Notes</p>
    <p>Built with Claude Code (Anthropic Claude Opus 4.6) + human direction, February 2026</p>
  </div>
</div>
</body>
</html>`;
}
