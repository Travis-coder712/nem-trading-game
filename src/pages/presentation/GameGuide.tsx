export default function GameGuide() {
  return (
    <div className="min-h-screen bg-navy-950 text-white print:bg-white print:text-black">
      {/* Print button - hidden when printing */}
      <div className="no-print sticky top-0 z-10 bg-navy-900/90 backdrop-blur-sm border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <a href="/" className="text-electric-400 hover:text-electric-300 text-sm font-medium">
          ← Back to Game
        </a>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-electric-500 hover:bg-electric-400 text-white text-sm font-medium rounded-lg transition-all"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 print:py-4 print:px-2">
        {/* Title */}
        <div className="text-center mb-10 print:mb-6">
          <div className="text-4xl mb-2 print:text-2xl">⚡</div>
          <h1 className="text-3xl md:text-4xl font-bold print:text-2xl">
            NEM Merit Order Training Game
          </h1>
          <p className="text-navy-300 print:text-gray-600 mt-2 text-lg print:text-sm">
            Quick Reference Guide
          </p>
        </div>

        {/* Overview */}
        <Section title="Overview">
          <p>
            You and your team own a portfolio of power generation assets in Australia's
            National Electricity Market (NEM). Each round, you submit price bids for your
            assets. The game engine dispatches the cheapest generation first (merit order)
            to meet demand. All dispatched generators receive the same clearing price.
            Your profit depends on the difference between the clearing price and your costs.
          </p>
        </Section>

        {/* Asset Types */}
        <Section title="Asset Types">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/20 print:border-gray-300">
                  <th className="text-left py-2 pr-4">Type</th>
                  <th className="text-left py-2 pr-4">Icon</th>
                  <th className="text-right py-2 pr-4">Capacity</th>
                  <th className="text-right py-2 pr-4">Marginal Cost ($/MWh)</th>
                  <th className="text-left py-2">Characteristics</th>
                </tr>
              </thead>
              <tbody>
                <AssetRow icon="🏭" type="Coal" capacity="800 MW" srmc="$25–45" desc="Baseload. Low cost, slow to ramp. Runs 24/7." />
                <AssetRow icon="🔥" type="Gas CCGT" capacity="350 MW" srmc="$65–85" desc="Mid-merit. Flexible, moderate cost." />
                <AssetRow icon="⚡" type="Gas Peaker" capacity="150 MW" srmc="$120–160" desc="Peak only. Very fast start, expensive." />
                <AssetRow icon="💧" type="Hydro" capacity="250 MW" srmc="$8" desc="Flexible, cheap, but limited water each round." />
                <AssetRow icon="🌬️" type="Wind" capacity="300 MW" srmc="$0" desc="Zero fuel cost. Output varies by wind conditions." />
                <AssetRow icon="☀️" type="Solar" capacity="200 MW" srmc="$0" desc="Zero fuel cost. Daytime only, peak in afternoon." />
                <AssetRow icon="🔋" type="Battery" capacity="150 MW / 300 MWh" srmc="$0" desc="Charge cheap, discharge expensive. 85% efficiency." />
              </tbody>
            </table>
          </div>
        </Section>

        {/* How Bidding Works */}
        <Section title="How Bidding Works">
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Each round has <strong>time periods</strong> (Overnight, Morning, Afternoon, Evening)</li>
            <li>For each asset + period, submit a <strong>price bid</strong> ($/MWh) and <strong>quantity</strong> (MW)</li>
            <li>You can split bids into <strong>multiple bands</strong> (e.g., 200 MW at $30, 300 MW at $80)</li>
            <li>Bids can range from <strong>-$1,000</strong> to <strong>$20,000</strong> per MWh</li>
            <li>Wind and solar bids are limited by weather-dependent capacity factors</li>
          </ol>
        </Section>

        {/* Merit Order Dispatch */}
        <Section title="Merit Order Dispatch">
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>All bids from all teams are sorted <strong>lowest to highest price</strong></li>
            <li>AEMO dispatches the cheapest bids first until demand is met</li>
            <li>The <strong>last (most expensive) bid dispatched</strong> sets the <strong>clearing price</strong></li>
            <li><strong>ALL</strong> dispatched generators receive the clearing price — even if they bid lower</li>
            <li>Generators not dispatched earn nothing (but avoid fuel costs)</li>
          </ol>
        </Section>

        {/* Profit Calculation */}
        <Section title="Profit Calculation">
          <div className="bg-navy-800/50 print:bg-gray-100 rounded-xl p-4 font-mono text-center text-lg print:text-sm my-4">
            <strong>Profit = (Clearing Price − Marginal Cost) × MW Dispatched × Hours</strong>
          </div>
          <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
            <li>If you bid <strong>below</strong> the clearing price → dispatched, earn profit</li>
            <li>If you bid <strong>above</strong> the clearing price → not dispatched, earn nothing</li>
            <li>If you bid <strong>at</strong> your marginal cost → break even (cover costs exactly)</li>
            <li>If clearing price goes <strong>negative</strong> → dispatched generators lose money!</li>
          </ul>
        </Section>

        {/* Strategies */}
        <Section title="Bidding Strategies">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:gap-2">
            <StrategyCard name="Price Taker" desc="Bid $0 on everything. Guarantees dispatch, accepts whatever clearing price results." />
            <StrategyCard name="Marginal Cost Bidder" desc="Bid at your Short Run Marginal Cost. Rational baseline — covers costs, earns when price is high." />
            <StrategyCard name="Price Maker" desc="Bid high on some capacity to push up the clearing price for all your dispatched units." />
            <StrategyCard name="Portfolio Optimizer" desc="Mix strategies: $0 on renewables, marginal cost on baseload, high on peakers." />
            <StrategyCard name="Strategic Withdrawal" desc="Withhold 20-30% of capacity to tighten supply and raise prices." />
            <StrategyCard name="Battery Arbitrage" desc="Charge at negative/low prices, discharge at peak. Profit from price spreads." />
          </div>
        </Section>

        {/* Time Periods */}
        <Section title="Time Periods">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:gap-2">
            <PeriodCard icon="🌙" name="Overnight" time="12am–6am" demand="Low" desc="Base load only. Potential negative prices with wind." />
            <PeriodCard icon="🌅" name="Morning" time="6am–12pm" demand="Medium" desc="Demand ramps up. Solar begins generating." />
            <PeriodCard icon="☀️" name="Afternoon" time="12pm–6pm" demand="Medium-High" desc="Solar at peak. Duck curve — prices can drop." />
            <PeriodCard icon="🌆" name="Evening" time="6pm–12am" demand="High" desc="Solar drops off. Peak demand. Highest prices." />
          </div>
        </Section>

        {/* Quick Reference */}
        <Section title="Quick Reference">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <RefCard label="Price Cap" value="$20,000/MWh" />
            <RefCard label="Price Floor" value="-$1,000/MWh" />
            <RefCard label="Dispatch Interval" value="5 minutes (real NEM)" />
            <RefCard label="NEM Regions" value="QLD, NSW, VIC, SA, TAS" />
            <RefCard label="Marginal Cost Badge Colors" value="Green=$0, Blue=<$50, Amber=<$100, Red=$100+" />
            <RefCard label="Game Periods" value="4 per round (after Round 1)" />
          </div>
        </Section>

        {/* Footer */}
        <div className="text-center mt-10 pt-6 border-t border-white/10 print:border-gray-300">
          <p className="text-navy-400 print:text-gray-500 text-xs">
            NEM Merit Order Training Game — Built for energy industry training
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 print:mb-5">
      <h2 className="text-xl font-bold text-electric-400 print:text-blue-700 mb-3 print:text-lg border-b border-white/10 print:border-gray-300 pb-2">
        {title}
      </h2>
      <div className="text-navy-200 print:text-gray-800 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function AssetRow({ icon, type, capacity, srmc, desc }: { icon: string; type: string; capacity: string; srmc: string; desc: string }) {
  return (
    <tr className="border-b border-white/5 print:border-gray-200">
      <td className="py-2 pr-4 font-medium">{type}</td>
      <td className="py-2 pr-4">{icon}</td>
      <td className="py-2 pr-4 text-right font-mono">{capacity}</td>
      <td className="py-2 pr-4 text-right font-mono">{srmc}</td>
      <td className="py-2 text-navy-300 print:text-gray-600">{desc}</td>
    </tr>
  );
}

function StrategyCard({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="bg-navy-800/50 print:bg-gray-50 rounded-lg p-3 print:border print:border-gray-200">
      <div className="font-semibold text-white print:text-black text-sm">{name}</div>
      <div className="text-navy-300 print:text-gray-600 text-xs mt-1">{desc}</div>
    </div>
  );
}

function PeriodCard({ icon, name, time, demand, desc }: { icon: string; name: string; time: string; demand: string; desc: string }) {
  return (
    <div className="bg-navy-800/50 print:bg-gray-50 rounded-lg p-3 text-center print:border print:border-gray-200">
      <div className="text-2xl print:text-xl">{icon}</div>
      <div className="font-semibold text-white print:text-black text-sm">{name}</div>
      <div className="text-navy-400 print:text-gray-500 text-xs">{time}</div>
      <div className="text-electric-400 print:text-blue-600 text-xs font-medium mt-1">Demand: {demand}</div>
      <div className="text-navy-300 print:text-gray-600 text-xs mt-1">{desc}</div>
    </div>
  );
}

function RefCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-navy-800/50 print:bg-gray-50 rounded-lg p-3 print:border print:border-gray-200">
      <div className="text-navy-400 print:text-gray-500 text-xs">{label}</div>
      <div className="font-mono font-bold text-white print:text-black text-sm mt-0.5">{value}</div>
    </div>
  );
}
