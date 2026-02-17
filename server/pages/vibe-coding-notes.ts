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
        <li><strong>All code writing:</strong> ~19,000 lines of TypeScript/JavaScript across ~60 files</li>
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
  <p>The entire game was built in a single intensive session of roughly 20 hours. Here's how it unfolded:</p>

  <div class="timeline">
    <div class="timeline-item">
      <h3>Phase 1: The Big Bang (Sunday morning)</h3>
      <p><span class="badge badge-purple">Human prompt</span> The user described the concept: a multiplayer NEM simulation game where teams bid electricity into a merit order dispatch.</p>
      <div class="human"><strong>What the human said (in essence):</strong> "Build a game that simulates the NEM. Teams should have different generation assets and bid them into the market. Use a merit order dispatch to determine the clearing price. Make it work on phones with a host dashboard on a big screen."</div>
      <div class="ai"><strong>What Claude did:</strong> Within a single conversation, Claude designed the entire application architecture, created 59 files, and wrote over 15,000 lines of code. This included the game engine, the merit order algorithm, the user interfaces for hosts and teams, real-time WebSocket communication, data visualisation charts, a QR code joining system, and an animated landing page. The game was playable at the end of this first session.</div>
      <div class="highlight"><strong>Key insight:</strong> Claude drew on its training knowledge of electricity markets, the Australian NEM specifically, software architecture patterns, and dozens of web technologies to build a complete working system from a high-level description. No line-by-line coding instructions were needed.</div>
    </div>

    <div class="timeline-item">
      <h3>Phase 2: Testing and Hardening (Sunday afternoon)</h3>
      <p><span class="badge badge-purple">Human feedback</span> The user tested the game and reported real-world issues.</p>
      <div class="human"><strong>What the human said (in essence):</strong> "The server crashes sometimes. The $0 is not showing in bids. The connections drop on mobile hotspot. We need a beginner mode for people who don't know the NEM. Make the marginal cost badges bigger."</div>
      <div class="ai"><strong>What Claude did:</strong> Added global error handlers to prevent server crashes, fixed the display bug, relaxed network timeout settings for poor WiFi connections, created a new Beginner game mode with only 2 asset types and a guided walkthrough, and improved various UI elements based on the feedback.</div>
      <div class="highlight"><strong>Key insight:</strong> The human didn't need to know <em>how</em> to fix a server crash or a display bug. They just reported what was wrong, and Claude diagnosed the root cause and implemented the fix.</div>
    </div>

    <div class="timeline-item">
      <h3>Phase 3: Making It Educational (Sunday evening)</h3>
      <p><span class="badge badge-purple">Human direction</span> The user wanted features that would help players learn, not just play.</p>
      <div class="human"><strong>What the human said (in essence):</strong> "Players need to understand what's happening with the merit order. Can we show them step by step how dispatch works? Also, add warnings if they're making bad bids. And the host should be able to see what teams are doing. Oh, and people need exit buttons."</div>
      <div class="ai"><strong>What Claude did:</strong> Built an animated merit order walkthrough that visually steps through the dispatch process, created a bid review modal that warns about common mistakes (bidding below cost, zero-MW bids), added a host team view feature, and added exit buttons throughout the application.</div>
    </div>

    <div class="timeline-item">
      <h3>Phase 4: Making It Theatrical (Sunday night)</h3>
      <p><span class="badge badge-purple">Human vision</span> The user wanted the game to feel like an event, not just a web page.</p>
      <div class="human"><strong>What the human said (in essence):</strong> "This needs cinematic transitions when the game starts and between rounds. Think trading floor energy. Add sound effects. Make it feel dramatic. Also the price cap should be $20,000 per MWh, that's the real NEM cap."</div>
      <div class="ai"><strong>What Claude did:</strong> Created a "MARKET OPEN" cinematic sequence with visual effects and built an entire procedural audio engine from scratch. Rather than using pre-recorded sound files, Claude wrote code that generates sounds using mathematical waveforms&mdash;buzzes, chimes, whooshes, and zaps&mdash;all synthesised in real time by the browser. Claude also updated the market price cap across the entire codebase to match the real NEM rules.</div>
      <div class="highlight"><strong>Key insight:</strong> The human said "make it sound dramatic." Claude independently decided to build a procedural audio engine using the Web Audio API, which is a sophisticated technical approach that avoids the need for audio files and creates unique sounds every time. This is an example of the AI making expert-level technical decisions that the human never specifically requested.</div>
    </div>

    <div class="timeline-item">
      <h3>Phase 5: Polish and Customisation (Monday morning)</h3>
      <p><span class="badge badge-purple">Human refinement</span> The user wanted customisation and final polish.</p>
      <div class="human"><strong>What the human said (in essence):</strong> "We need to be able to edit the asset configurations so we can run different scenarios. The term SRMC is too jargony&mdash;call it Marginal Cost instead. Some of the animations are janky. Fix the transitions."</div>
      <div class="ai"><strong>What Claude did:</strong> Built a complete asset configuration editor (save/load presets), renamed "SRMC" to "Marginal Cost" across all code and user-facing content, rewrote the transition animations from a library-based approach to pure CSS for better reliability, and added various quality-of-life improvements.</div>
    </div>
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
          <li><strong>~19,000 lines of code</strong> written</li>
          <li><strong>~60 files</strong> created</li>
          <li><strong>5 major versions</strong> committed</li>
          <li><strong>~20 hours</strong> total development time</li>
          <li><strong>7 asset types</strong> with realistic parameters</li>
          <li><strong>10+ scenario events</strong></li>
          <li><strong>4 game modes</strong></li>
        </ul>
      </div>
      <div>
        <h3>What Would This Normally Take?</h3>
        <p>A similar application built by a traditional development team would typically require:</p>
        <ul>
          <li>A team of 2&ndash;4 developers</li>
          <li>A UX/UI designer</li>
          <li>A subject matter expert for NEM content</li>
          <li>4&ndash;8 weeks of development</li>
          <li>Cost: approximately $50,000&ndash;$150,000 in developer time</li>
        </ul>
        <p>The vibe coding approach reduced this to <strong>one person + AI over a single weekend</strong>.</p>
      </div>
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
      <li><strong>Complex debugging can be tricky.</strong> When something goes wrong, explaining the problem to the AI sometimes takes more effort than explaining what you want built.</li>
    </ul>
  </div>

  <div class="card">
    <h3>Is this the future of software development?</h3>
    <p>Vibe coding is rapidly becoming a mainstream approach for building applications, especially prototypes, internal tools, and educational software. It dramatically lowers the barrier to entry for software creation and compresses development timelines from weeks to hours. However, large-scale enterprise systems, safety-critical software, and highly regulated environments will likely continue to require traditional development practices with extensive testing, code review, and quality assurance for the foreseeable future.</p>
    <p>What is clear is that AI-assisted development&mdash;whether through vibe coding or more traditional AI pair-programming&mdash;is becoming a standard tool in every developer's toolkit.</p>
  </div>

  <h2>The Takeaway</h2>
  <div class="callout">
    <p>This game was built by a <strong>collaboration between human vision and AI capability</strong>. The human knew what the NEM is, how it works, and what the game should teach. The AI knew how to build a real-time multiplayer web application, create data visualisations, synthesise audio, and structure 19,000 lines of code into a maintainable architecture. Neither could have built this alone in the time available.</p>
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
