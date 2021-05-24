<script context="module">
    import { csvParse } from 'd3-dsv';
    import ChartDaily from '../_partials/ChartDaily.svelte';
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
    import { mean, quantileSorted, ascending } from 'd3-array'
    import { maxDate, showDays, innerWidth } from '../_partials/stores';
    import StationSelect from '../_partials/StationSelect.svelte';

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
                d.rain30days += x.RSK && x.RSK !== -999 ? x.RSK : 0;
                if (x.prev) x = x.prev;
                else break;
            }
            delete d.prev;
        });

        dataLinked = data2;
    }

    $: today = data.find(d => d.date - $maxDate < 10);

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
            let tempSum = 0;
            let tempRain = 0;
            dates.forEach(d => {
                tempSum += d.TXK;
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

    $: isForecast = !dayjs().isBefore(today, dayjs().startOf('day'))

    function moveDate(delta, by) {
        // console.log('move', delta, dayjs(today.date).add(delta, 'day').toDate())
        $maxDate = dayjs(today.date).add(delta, by).toDate()
    }

</script>

<style>
    h1 {
        margin-bottom: 0;
    }
    h2 {
        color: var(--gray);
    }
</style>

<StationSelect {stationen} />


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


<h2>{station.name}, {station.state}</h2>

<p>Heute, am <b>{dayjs($maxDate).format('LL')}</b> ist es in {station.name} {isForecast ? 'vorraussichtlich' : ''} max. {fmtTemp(today.TXK)} und es gibt {fmtRain(today.RSK)} Niederschlag.</p>

<h3>So warm war es die letzten {$showDays} Tage</h3>
<ChartDaily data="{dataLinked}" {context} yMin={-5} yMax={30} show="TXK" />

<p>Wir vergleichen die aktuellen Werte mit den Jahren {baseMinYear}-{baseMinYear+29}. Sie waren noch kaum von der Erdwärmung betroffen. Daher gilt dieser Zeitraum als offizieller Vergleichspunkt für Veränderungen durch den Klimawandel.</p>

<h3>Niederschlag</h3>
<ChartDaily data="{dataLinked}" includeZero={true} {context} ymax="{80}" show="rain30days" />

<h3>So warm war der {curMonthName} die letzten x Jahre</h3>
<h3>So regnerisch war der {curMonthName} die letzten x Jahre</h3>
<h3>Fazit</h3>
<h3>Quellen und Datenhinweise</h3>


<p>Heute ist es in {station.name}...</p>

<p>{dayjs($maxDate).format('LL')}</p>
<p>max. {fmtTemp(today.TXK)}<br />{fmtRain(today.RSK)}</p>
{today}
{context[today.day]}

<h1>{station.name}</h1>

{station.id}