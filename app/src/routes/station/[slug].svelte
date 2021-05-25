<script context="module">
    import { csvParse } from 'd3-dsv';
    import { browser } from '$app/env';
    import parseStations from '$lib/parseStations';
    import parseStationData from '$lib/parseStationData';

    let stationen;

    /**
     * @type {import('@sveltejs/kit').Load}
     */
    export async function load({ page, fetch, session, context }) {
        if (!stationen) {
            const res = await fetch('/data/stations.csv');
            stationen = parseStations(await res.text())
        }

        const station = stationen.find(s => s.slug === page.params.slug);

        if (station) {
            const res2 = await fetch(`/data/stations/${station.id}-fc.csv`);
            const data = parseStationData(await res2.text());

            return {
                props: {
                    data: data.map(d => ({...d, date: new Date(d.date)})),
                    station,
                    stationen
                }
            };
        }

        return {
            status: res.status,
            error: new Error(`Could not load ${page.params.slug}`)
        };
    }

</script>

<script>
    import dayjs from 'dayjs';
    import { mean, quantileSorted, quantile, ascending, group, sum } from 'd3-array'
    import { maxDate, showDays, innerWidth } from '../_partials/stores';
    import StationSelect from '../_partials/StationSelect.svelte';
    import ChartDaily from '../_partials/ChartDaily.svelte';
    import ChartYearly from '../_partials/ChartYearly.svelte';

    export let stationen;
    export let station;
    export let data;

    let baseMinYear = 1961;

    function fmtTemp(temp) {
        return String(temp).replace('.',',')+'°C'
    }
    function fmtRain(rain) {
        return String(rain).replace('.',',')+' mm/Tag'
    }

    let dataLinked = [];
    $: {
        const data2 = data.map(d => ({
            ...d
        }));

        data2.forEach((d,i) => {
            d.prev = data2.length > i ? data2[i+1] : null
        });

        data2.forEach(d => {
            d.rain30days = 0;
            let x = d;
            for (let i = 0; i < 30; i++) {
                d.rain30days += x.RSK && x.RSK !== -999 && !isNaN(x.RSK) ? x.RSK : 0;
                if (x.prev) x = x.prev;
                else break;
            }
            delete d.prev;
        });

        dataLinked = data2;
    }

    $: today = dataLinked.find(d => d.date - $maxDate < 10);

    let tempQuartileRange = 50;

    let context = {};
    $: {
        context = {};
        let day = dayjs('2021-01-01');
        while (day.year() === 2021) {
            context[day.format('MM-DD')] = getContext(day, dataLinked);
            day = day.add(1, 'day');
        }
        function getContext(day, data) {
            const fmt = day.format('MM-DD');
            const dates = data.filter(d =>
                d.year >= baseMinYear &&
                d.year < baseMinYear+30 &&
                d.day === fmt
            );
            let tempValues = dates.map(d => d.TXK).sort(ascending);
            let tempRain = 0;
            dates.forEach(d => {
                tempRain += d.rain30days;
            })
            return {
                day: fmt,
                TXK: mean(tempValues),
                TXK_lo: quantileSorted(tempValues, 0.5-(tempQuartileRange/100)*0.5),
                TXK_hi: quantileSorted(tempValues, 0.5+(tempQuartileRange/100)*0.5),
                rain30days: tempRain / dates.length
            }
        }
    }

    $: curMonth = today.date.getMonth()
    $: curMonthName = dayjs(today.date).format('MMMM');

    let monthlyStats;
    let monthlyBase;
    $: {
        monthlyStats = [];
        group(dataLinked.filter(d => d.date.getMonth() === curMonth), d => d.year).forEach((value, key) => {
            const avgMaxTemp = mean(value, d => d.TXK);
            const sumPrecip = sum(value, d => d.RSK !== -999 ? d.RSK : 0);
            monthlyStats.push({
                year: key,
                temp: avgMaxTemp,
                precip: sumPrecip
            })
        });
        const base = monthlyStats.filter(d => d.year >= baseMinYear && d.year < baseMinYear+30);
        monthlyBase = {
            temp_lo: quantile(base, 0.5-(tempQuartileRange/100)*0.5, d => d.temp),
            temp_hi: quantile(base, 0.5+(tempQuartileRange/100)*0.5, d => d.temp),
            precip_lo: quantile(base, 0.5-(tempQuartileRange/100)*0.5, d => d.precip),
            precip_hi: quantile(base, 0.5+(tempQuartileRange/100)*0.5, d => d.precip),
        }
    }

    $: isForecast = !dayjs().isBefore(today, dayjs().startOf('day'))

    function moveDate(delta, by) {
        // console.log('move', delta, dayjs(today.date).add(delta, 'day').toDate())
        $maxDate = dayjs(today.date).add(delta, by).toDate()
    }

    $: numYears = $innerWidth < 550 ? 10 : 20;

    $: tempSentence = today.TXK > context[today.day].TXK_hi ? 'überdurchschnittlich warm' :
        today.TXK < context[today.day].TXK_lo ? 'überdurchschnittlich kalt' :
        'normal warm';

    $: precipSentence = today.rain30days > context[today.day].rain30days * 1.1 ? 'überdurchschnittlich viel' :
        today.rain30days < context[today.day].rain30days * 0.9 ? 'überdurchschnittlich wenig' :
        'normal viel';

</script>

<style>
    h1 {
        margin-bottom: 0;
    }
    h2 {
        color: var(--gray);
    }
    .flex {
        display: flex;
        width: 100%;
        font-size: 1.5rem;
    }
    .flex div {
        width: 50%;
        text-align: center;
    }
</style>

<StationSelect {stationen} />

<h2>{station.name}, {station.state}</h2>

<div class="flex">
    <div>
        <b>{dayjs($maxDate).format('LL')}</b><br>
        max. {fmtTemp(today.TXK)}<br>
        {fmtRain(today.RSK)}<br>
    </div>
    <div>
        Heute ist es in {station.name} {tempSentence}. Außerdem regnet es gerade {precipSentence}.
    </div>
</div>

<h3>So warm war es die letzten {$showDays} Tage</h3>
<p>Tageshöchsttemperatur</p>
<ChartDaily
    unit=" °C"
    label="Tageshöchst-\ntemperatur in °C"
    data="{dataLinked}"
    {context}
    yMin={-5}
    yMax={30}
    show="TXK" />

<p>Wir vergleichen die aktuellen Werte mit den Jahren {baseMinYear}-{baseMinYear+29}. Sie waren noch kaum von der Erdwärmung betroffen. Daher gilt dieser Zeitraum als offizieller Vergleichspunkt für Veränderungen durch den Klimawandel.</p>

<h3>Niederschlag</h3>
<ChartDaily
    label="Niederschlagshöhe\nin den letzten 30 Tagen"
    unit="mm/30 Tage"
    data="{dataLinked}"
    includeZero={true}
    {context}
    ymax="{80}"
    show="rain30days" />

<h3>So warm war der {curMonthName} die letzten {numYears} Jahre</h3>

<ChartYearly
    month={curMonth}
    data="{monthlyStats}"
    includeZero={false}
    context={monthlyBase}
    {numYears}
    label="Durchschnittliche\nTageshöchsttemperatur\nim {curMonthName} in °C"
    unit=" °C"
    show="temp" />


<h3>So regnerisch war der {curMonthName} die letzten {numYears} Jahre</h3>
<p></p>
<ChartYearly
    label="Monatssumme der\nNiederschlagshöhe im {curMonthName} (mm)"
    month={curMonth}
    data="{monthlyStats}"
    includeZero={true}
    context={monthlyBase}
    {numYears}
    unit="mm/30 Tage"
    show="precip" />

<h3>Fazit</h3>

<h3>Quellen und Datenhinweise</h3>


{$innerWidth}
&lt; <button on:click={() => moveDate(-1, 'month')}>1 Monat</button>
<button on:click={() => moveDate(-1, 'day')}>1 Tag</button>
-
<button on:click={() => moveDate(+1, 'day')}>1 Tag</button>
<button on:click={() => moveDate(+1, 'month')}>1 Monat</button> &gt;


<input type="number" min="50" max="98" step="5" bind:value="{tempQuartileRange}" />
<select bind:value="{baseMinYear}">
    <option value="{1991}">1991-2020</option>
    <option value="{1981}">1981-2010</option>
    <option value="{1971}">1971-2000</option>
    <option value="{1961}">1961-1990</option>
</select>
<hr />
