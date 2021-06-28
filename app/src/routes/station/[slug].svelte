<script context="module">
    let stationen;

    /**
     * @type {import('@sveltejs/kit').Load}
     */
    export async function load({ page, fetch, session, context }) {
        if (!stationen) {
            const res = await fetch('/data/stations.json');
            stationen = await res.json()
        }
        const station = stationen.find(s => s.slug === page.params.slug);

        if (station) {
            const res2 = await fetch(`/data/stations/${station.id}.json`);
            const {data, monthlyStats} = await res2.json();

            const res3 = await fetch(`/data/stations/${station.id}-ctx.json`);
            const context = await res3.json();

            return {
                props: {
                    stationen,
                    data: data.map(d => ({
                        ...d,
                        date: new Date(d.date),
                        TXK: d.TXK === null ? Number.NaN : d.TXK,
                        context: context[d.day]
                    })),
                    station,
                    monthlyStats
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
    import { maxDate, showDays, innerWidth } from '$lib/stores';
    import { fmtTemp, fmtRain } from '$lib/formats';
    import StationSelect from '../_partials/StationSelect.svelte';
    import ChartDaily from '../_partials/ChartDaily.svelte';
    import ChartYearly from '../_partials/ChartYearly.svelte';
    import TopInfo from '../_partials/TopInfo.svelte';
    import { beforeUpdate, onMount } from 'svelte';

    export let stationen;
    export let station;
    export let data;
    export let monthlyStats;


    let baseMinYear = 1961;
    $: today = data.find(d => d.date - $maxDate < 1000);
    let tempQuartileRange = 50;

    $: curMonth = today.date.getMonth()
    $: curMonthName = dayjs(today.date).format('MMMM');

    $: isForecast = !dayjs().isBefore(today, dayjs().startOf('day'))

    function moveDate(delta, by) {
        // console.log('move', delta, dayjs(today.date).add(delta, 'day').toDate())
        $maxDate = dayjs(today.date).add(delta, by).toDate()
    }

    $: numYears = $innerWidth < 550 ? 20 : 40;

    let monthlyData = [];
    $: {
        monthlyData = monthlyStats[curMonth].stats.slice(0);
        console.log(monthlyData[0])
    }

    let copySentence;

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

<h2>{station.name}, {station.state}</h2>

{#if data.length}
<TopInfo {station} {today} bind:copySentence />
{/if}

<p>Zu warm für einen Tag im Februar, zu regnerisch für August? Das täglich wechselnde Wetter erleben wir sehr individuell. So kann es passieren, dass wir Ausreißer überschätzen – und langfristige Veränderungen, die weniger spürbar sind, eher verborgen bleiben.</p>

<p>Das wollen wir ändern. </p>

<p>Auf dieser Seite kannst du nachschauen, ob das aktuelle Wetter in deiner Region im langjährigen Klima-Durchschnitt liegt und normal ist – oder davon abweicht.  </p>

<h3>🌡️ So warm ist es gerade in {station.name} im Vergleich zum Klima-Durchschnitt</h3>

<ChartDaily
    unit=" °C"
    label="Tageshöchst-\ntemperatur in °C"
    data="{data}"
    yMin={-5}
    yMax={30}
    show="TXK" />

<p>{copySentence}</p>

<p>Wir vergleichen die aktuellen Werte mit den Jahren {baseMinYear}-{baseMinYear+29}. Sie waren noch kaum von der Erdwärmung betroffen. Daher gilt dieser Zeitraum als offizieller Vergleichspunkt für Veränderungen durch den Klimawandel.</p>

<h3>Niederschlagsmenge über 30 Tage</h3>


<ChartDaily
    label="Niederschlagsmenge\nkummuliert über 30 Tage"
    unit="mm/30 Tage"
    data="{data}"
    includeZero={true}
    ymax="{80}"
    show="rain30days" />

<p>Tägliche Niederschlagsmengen variieren stark. Um Ausreißer auszugleichen, betrachten wir einen Zeitraum von 30 Tage.</p>

<h3>So warm war der {curMonthName} in {station.name} die letzten {numYears} Jahre</h3>

{#if monthlyStats}





<div style="position: relative;">
    <img width="30" src="../../thermometer.svg" style="position: absolute; left: -50px;">
    <ChartYearly
        month={curMonth}
        data="{monthlyData}"
        context={monthlyStats[curMonth].base}
        includeZero={true}
        {numYears}
        label="Durchschnittliche\nTageshöchsttemperatur\nim {curMonthName} in °C"
        unit=" °C"
        show="temp" />
</div>

{/if}

<h3>So regnerisch war der {curMonthName} in {station.name} die letzten {numYears} Jahre</h3>

{#if monthlyStats}
<ChartYearly
    label="Monatssumme der\nNiederschlagshöhe im {curMonthName} (mm)"
    month={curMonth}
    data="{monthlyData}"
    context={monthlyStats[curMonth].base}
    includeZero={true}
    {numYears}
    unit="mm/30 Tage"
    show="precip" />
{/if}

<h3>Fazit</h3>

<h3>Quellen und Datenhinweise</h3>


{$innerWidth}
&lt; <button on:click={() => moveDate(-1, 'month')}>1 Monat</button>
<button on:click={() => moveDate(-1, 'day')}>1 Tag</button>
-
<button on:click={() => moveDate(+1, 'day')}>1 Tag</button>
<button on:click={() => moveDate(+1, 'month')}>1 Monat</button> &gt;

