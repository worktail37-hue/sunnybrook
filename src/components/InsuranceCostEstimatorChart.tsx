import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Calculator, Calendar, CheckCircle2, Users, ShieldCheck } from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicConfig';

interface InsuranceCostEstimatorChartProps {
  activeServiceId: string;
  onSelectService: (serviceId: string) => void;
  onBookService: (serviceName: string) => void;
}

interface ComputedCostRow {
  serviceId: string;
  number: string;
  shortName: string;
  unitLabel: string;
  totalFee: number;
  coveredAmount: number;
  outOfPocket: number;
  coveragePercent: number;
}

export const InsuranceCostEstimatorChart: React.FC<InsuranceCostEstimatorChartProps> = ({
  activeServiceId,
  onSelectService,
  onBookService,
}) => {
  const { insurancePlans, serviceBaseCosts, currencySymbol, disclaimerNote } =
    CLINIC_CONFIG.costEstimator;

  // Default to Corporate Family Health + Dental so families immediately see insurance vs out-of-pocket comparison
  const [selectedPlanId, setSelectedPlanId] = useState<string>(insurancePlans[2].id);
  const [familyMembersCount, setFamilyMembersCount] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Math.min(680, Math.max(260, window.innerWidth - 56));
    }
    return 320;
  });

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const selectedPlan = useMemo(
    () => insurancePlans.find((p) => p.id === selectedPlanId) || insurancePlans[0],
    [insurancePlans, selectedPlanId]
  );

  // Compute per-service costs based on selected insurance plan & number of family members
  const chartData: ComputedCostRow[] = useMemo(() => {
    return serviceBaseCosts.map((item) => {
      const totalFee = item.baseCostInr * familyMembersCount;
      const rawRate = selectedPlan.coverageRates[item.category] ?? 0;
      const uncappedCovered = Math.round(totalFee * rawRate);
      const coveredAmount =
        selectedPlan.annualCapInr > 0
          ? Math.min(uncappedCovered, selectedPlan.annualCapInr)
          : 0;
      const outOfPocket = Math.max(0, totalFee - coveredAmount);
      const coveragePercent =
        totalFee > 0 ? Math.round((coveredAmount / totalFee) * 100) : 0;

      return {
        serviceId: item.serviceId,
        number: item.number,
        shortName: item.shortName,
        unitLabel: item.unitLabel,
        totalFee,
        coveredAmount,
        outOfPocket,
        coveragePercent,
      };
    });
  }, [serviceBaseCosts, selectedPlan, familyMembersCount]);

  const activeRow = useMemo(
    () => chartData.find((d) => d.serviceId === activeServiceId) || chartData[0],
    [chartData, activeServiceId]
  );

  // Observe responsive container width
  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;

    const updateSize = () => {
      const rectW = node.getBoundingClientRect().width;
      const maxAvailableW = Math.max(240, window.innerWidth - 48);
      const w = Math.min(rectW, maxAvailableW);
      if (w > 180) {
        setContainerWidth(Math.floor(w));
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(node);
    window.addEventListener('resize', updateSize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Render & update interactive D3.js horizontal stacked bar chart
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const transitionDuration = prefersReducedMotion ? 0 : 450;

    const isExtraCompact = containerWidth < 380;
    const isCompact = containerWidth < 540;
    const margin = {
      top: 20,
      right: isExtraCompact ? 72 : isCompact ? 88 : 116,
      bottom: 36,
      left: isExtraCompact ? 108 : isCompact ? 128 : 164,
    };

    const rowHeight = isExtraCompact ? 46 : 52;
    const height = margin.top + margin.bottom + chartData.length * rowHeight;
    const innerWidth = Math.max(80, containerWidth - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgEl);
    svg
      .attr('viewBox', `0 0 ${containerWidth} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    // Ensure root group exists
    let rootG = svg.select<SVGGElement>('g.chart-root');
    if (rootG.empty()) {
      rootG = svg.append('g').attr('class', 'chart-root');
      rootG.append('g').attr('class', 'x-grid');
      rootG.append('g').attr('class', 'bars-layer');
      rootG.append('g').attr('class', 'x-axis');
      rootG.append('g').attr('class', 'y-axis');
    }
    rootG.attr('transform', `translate(${margin.left},${margin.top})`);

    const maxTotalFee = d3.max(chartData, (d) => d.totalFee) || 15000;
    const xScale = d3
      .scaleLinear()
      .domain([0, maxTotalFee * 1.08])
      .range([0, innerWidth])
      .nice();

    const yScale = d3
      .scaleBand<string>()
      .domain(chartData.map((d) => d.serviceId))
      .range([0, innerHeight])
      .padding(0.28);

    // 1. Subtle vertical gridlines
    const xGrid = rootG.select<SVGGElement>('g.x-grid');
    xGrid
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(isCompact ? 3 : 5)
          .tickSize(-innerHeight)
          .tickFormat(() => '')
      )
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .selectAll('.tick line')
          .attr('stroke', '#0B2B3A')
          .attr('stroke-opacity', 0.1)
          .attr('stroke-dasharray', '4,4')
      );

    // 2. X Axis at bottom
    const xAxis = rootG.select<SVGGElement>('g.x-axis');
    xAxis
      .attr('transform', `translate(0,${innerHeight})`)
      .transition()
      .duration(transitionDuration)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(isCompact ? 3 : 5)
          .tickFormat((val) => `${currencySymbol}${Number(val).toLocaleString('en-IN')}`)
      )
      .selection()
      .call((g) => g.select('.domain').attr('stroke', '#0B2B3A').attr('stroke-opacity', 0.25))
      .call((g) =>
        g
          .selectAll('text')
          .attr('fill', '#0B2B3A')
          .style('font-family', 'var(--font-body)')
          .style('font-size', '13px')
          .style('font-weight', '600')
      );

    // 3. Y Axis labels (clickable service names)
    const yAxis = rootG.select<SVGGElement>('g.y-axis');
    yAxis
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(0)
          .tickFormat((serviceId) => {
            const match = chartData.find((c) => c.serviceId === serviceId);
            return match ? match.shortName : serviceId;
          })
      )
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .selectAll<SVGTextElement, string>('text')
          .attr('x', -10)
          .attr('fill', (d) => (d === activeServiceId ? '#0E7C86' : '#0B2B3A'))
          .style('font-family', 'var(--font-heading)')
          .style('font-size', isCompact ? '13px' : '15px')
          .style('font-weight', (d) => (d === activeServiceId ? '800' : '700'))
          .style('cursor', 'pointer')
          .on('click', (_event, serviceId) => {
            onSelectService(serviceId);
          })
      );

    // 4. Stacked Horizontal Bars per Service
    const barsLayer = rootG.select<SVGGElement>('g.bars-layer');
    const rowGroups = barsLayer
      .selectAll<SVGGElement, ComputedCostRow>('g.service-row')
      .data(chartData, (d) => d.serviceId);

    const rowEnter = rowGroups
      .enter()
      .append('g')
      .attr('class', 'service-row')
      .style('cursor', 'pointer');

    // Background highlight row when selected
    rowEnter
      .append('rect')
      .attr('class', 'row-highlight')
      .attr('rx', 10)
      .attr('ry', 10);

    // Segment A: Insurance Covered Amount (Clinic Teal #0E7C86)
    rowEnter
      .append('rect')
      .attr('class', 'bar-covered')
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('x', 0)
      .attr('width', 0);

    // Segment B: Family Out-of-Pocket Amount (Warm Coral #FF7A59 with Deep Navy stroke)
    rowEnter
      .append('rect')
      .attr('class', 'bar-oop')
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('x', 0)
      .attr('width', 0);

    // End-of-bar text label showing "You pay: ₹X,XXX"
    rowEnter
      .append('text')
      .attr('class', 'bar-label')
      .attr('dominant-baseline', 'middle');

    const rowMerged = rowEnter.merge(rowGroups);

    rowMerged
      .attr('transform', (d) => `translate(0,${yScale(d.serviceId) || 0})`)
      .on('click', (_event, d) => {
        onSelectService(d.serviceId);
      });

    const bandwidth = yScale.bandwidth();

    rowMerged
      .select<SVGRectElement>('rect.row-highlight')
      .attr('x', -margin.left + 4)
      .attr('y', -4)
      .attr('width', containerWidth - 8)
      .attr('height', bandwidth + 8)
      .attr('fill', (d) => (d.serviceId === activeServiceId ? '#E6F4F1' : 'transparent'))
      .attr('stroke', (d) => (d.serviceId === activeServiceId ? '#0E7C86' : 'transparent'))
      .attr('stroke-width', 1.5);

    rowMerged
      .select<SVGRectElement>('rect.bar-covered')
      .attr('y', 0)
      .attr('height', bandwidth)
      .attr('fill', '#0E7C86')
      .transition()
      .duration(transitionDuration)
      .attr('x', 0)
      .attr('width', (d) => Math.max(0, xScale(d.coveredAmount)));

    rowMerged
      .select<SVGRectElement>('rect.bar-oop')
      .attr('y', 0)
      .attr('height', bandwidth)
      .attr('fill', '#FF7A59')
      .attr('stroke', '#0B2B3A')
      .attr('stroke-width', 1.2)
      .transition()
      .duration(transitionDuration)
      .attr('x', (d) => xScale(d.coveredAmount))
      .attr('width', (d) => Math.max(0, xScale(d.outOfPocket)));

    rowMerged
      .select<SVGTextElement>('text.bar-label')
      .attr('y', bandwidth / 2 + 4)
      .attr('fill', '#0B2B3A')
      .style('font-family', 'var(--font-body)')
      .style('font-size', isCompact ? '12px' : '13.5px')
      .style('font-weight', '700')
      .text((d) =>
        d.outOfPocket === 0
          ? '₹0 (100% covered)'
          : `${currencySymbol}${d.outOfPocket.toLocaleString('en-IN')}`
      )
      .transition()
      .duration(transitionDuration)
      .attr('x', (d) => xScale(d.totalFee) + 8);

    rowGroups.exit().remove();
  }, [chartData, containerWidth, activeServiceId, currencySymbol, onSelectService]);

  return (
    <div className="bg-[#E6F4F1] rounded-3xl p-4 sm:p-8 lg:p-10 border border-[#0E7C86]/25 space-y-6 sm:space-y-8 w-full max-w-full overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-[#0B2B3A] font-bold text-[16px]">
            <Calculator className="w-5 h-5 text-[#0E7C86]" aria-hidden="true" />
            <span>Interactive treatment cost &amp; insurance estimator</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B2B3A]">
            Compare family out-of-pocket costs across plans
          </h3>
          <p className="text-[#0B2B3A] text-[16px]">
            Select an insurance or OPD dental benefit tier and how many family members need care. Click any bar in the chart to inspect exact savings.
          </p>
        </div>

        {/* Family Member Multiplier Selector */}
        <div className="bg-[#FFFFFF] rounded-2xl p-3.5 border border-[#0E7C86]/20 shrink-0 space-y-1.5">
          <label
            htmlFor="estimator-family-size"
            className="caption-text font-bold text-[#0B2B3A] flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-[#0E7C86]" aria-hidden="true" />
            <span>Number of family members:</span>
          </label>
          <div
            id="estimator-family-size"
            role="group"
            aria-label="Select number of family members"
            className="grid grid-cols-2 sm:grid-cols-4 gap-1.5"
          >
            {[1, 2, 3, 4].map((count) => {
              const isSelected = familyMembersCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => setFamilyMembersCount(count)}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl font-bold text-[15px] transition-colors tabular-nums whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#0E7C86] text-[#FFFFFF]'
                      : 'bg-[#E6F4F1] text-[#0B2B3A] hover:bg-[#0E7C86]/15'
                  }`}
                >
                  {count} {count === 1 ? 'person' : 'people'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insurance Plan Selector Buttons */}
      <div className="space-y-3">
        <div className="caption-text font-bold text-[#0B2B3A]">
          Choose insurance or corporate OPD plan:
        </div>
        <div
          role="radiogroup"
          aria-label="Insurance plan options"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {insurancePlans.map((plan) => {
            const isSelected = plan.id === selectedPlan.id;
            return (
              <button
                key={plan.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`text-left rounded-2xl p-4 border transition-colors min-h-[48px] flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#0E7C86] text-[#FFFFFF] border-[#0E7C86]'
                    : 'bg-[#FFFFFF] text-[#0B2B3A] border-[#0B2B3A]/15 hover:border-[#0E7C86]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-[16px] leading-snug">
                    {plan.shortLabel}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-[#FFFFFF] shrink-0" aria-hidden="true" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-semibold block ${
                    isSelected ? 'text-[#E6F4F1]' : 'text-[#0B2B3A]'
                  }`}
                >
                  {plan.annualCapInr > 0
                    ? `Annual cap: ₹${plan.annualCapInr.toLocaleString('en-IN')}`
                    : 'Standard clinic tariff'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: D3.js SVG Chart (Left 8 cols) + Selected Service Summary Card (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-w-0">
        <div
          ref={wrapperRef}
          className="lg:col-span-8 min-w-0 w-full bg-[#FFFFFF] rounded-2xl p-3.5 sm:p-6 border border-[#0E7C86]/20 overflow-hidden"
        >
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-[#E6F4F1]">
            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              <div className="inline-flex items-center gap-2 caption-text font-bold text-[#0B2B3A]">
                <span
                  className="w-4 h-4 rounded bg-[#0E7C86] inline-block shrink-0"
                  aria-hidden="true"
                />
                <span>Insurance / OPD covered ({currencySymbol})</span>
              </div>
              <div className="inline-flex items-center gap-2 caption-text font-bold text-[#0B2B3A]">
                <span
                  className="w-4 h-4 rounded bg-[#FF7A59] border border-[#0B2B3A] inline-block shrink-0"
                  aria-hidden="true"
                />
                <span>Estimated out-of-pocket you pay ({currencySymbol})</span>
              </div>
            </div>
            <span className="caption-text text-[#0B2B3A]">
              Tap any row to inspect
            </span>
          </div>

          {/* D3 SVG Canvas */}
          <svg
            ref={svgRef}
            className="w-full max-w-full block select-none"
            role="img"
            aria-label={`Horizontal bar chart comparing insurance coverage and out-of-pocket dental costs under ${selectedPlan.name}`}
          />

          {/* Screen-reader accessible fallback table */}
          <table className="sr-only">
            <caption>
              Estimated dental treatment costs under {selectedPlan.name} for {familyMembersCount}{' '}
              family member(s)
            </caption>
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">Total Clinic Fee</th>
                <th scope="col">Insurance Covered</th>
                <th scope="col">Estimated Out of Pocket</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr key={row.serviceId}>
                  <td>{row.serviceId}</td>
                  <td>
                    {currencySymbol}
                    {row.totalFee.toLocaleString('en-IN')}
                  </td>
                  <td>
                    {currencySymbol}
                    {row.coveredAmount.toLocaleString('en-IN')}
                  </td>
                  <td>
                    {currencySymbol}
                    {row.outOfPocket.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Service Cost Breakdown Card */}
        <div className="lg:col-span-4 bg-[#FFFFFF] rounded-2xl p-6 border border-[#0E7C86]/25 space-y-5">
          <div className="space-y-1 border-b border-[#E6F4F1] pb-4">
            <span className="caption-text font-extrabold text-[#0E7C86]">
              Selected treatment estimate
            </span>
            <h4 className="text-xl font-extrabold text-[#0B2B3A]">
              {activeRow.number}. {activeRow.serviceId}
            </h4>
            <p className="caption-text text-[#0B2B3A]">
              Unit: {activeRow.unitLabel} × {familyMembersCount}{' '}
              {familyMembersCount === 1 ? 'person' : 'people'}
            </p>
          </div>

          <dl className="space-y-3 text-[16px]">
            <div className="flex items-center justify-between text-[#0B2B3A]">
              <dt>Standard clinic fee:</dt>
              <dd className="font-bold tabular-nums">
                {currencySymbol}
                {activeRow.totalFee.toLocaleString('en-IN')}
              </dd>
            </div>

            <div className="flex items-center justify-between text-[#0E7C86]">
              <dt className="font-semibold">
                Est. insurance cover ({activeRow.coveragePercent}%):
              </dt>
              <dd className="font-extrabold tabular-nums">
                − {currencySymbol}
                {activeRow.coveredAmount.toLocaleString('en-IN')}
              </dd>
            </div>

            <div className="pt-3 border-t border-[#E6F4F1] flex items-baseline justify-between text-[#0B2B3A]">
              <dt className="font-extrabold text-[17px]">Estimated you pay:</dt>
              <dd
                className="text-2xl font-extrabold text-[#0B2B3A] tabular-nums"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {currencySymbol}
                {activeRow.outOfPocket.toLocaleString('en-IN')}
              </dd>
            </div>
          </dl>

          <div className="bg-[#E6F4F1] rounded-xl p-3.5 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#0E7C86] shrink-0 mt-0.5" aria-hidden="true" />
            <p className="caption-text text-[#0B2B3A]">
              <span className="font-bold">{selectedPlan.shortLabel}:</span>{' '}
              {selectedPlan.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onBookService(activeRow.serviceId)}
            className="btn-coral w-full"
          >
            <Calendar className="w-5 h-5 text-[#0B2B3A]" aria-hidden="true" />
            <span>Book {activeRow.serviceId.toLowerCase()}</span>
          </button>

          <p className="caption-text text-[#0B2B3A]">{disclaimerNote}</p>
        </div>
      </div>
    </div>
  );
};
