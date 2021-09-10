<script>
    import dayjs from 'dayjs';
    import { maxDate, innerWidth } from '$lib/stores';
    import { fmtTemp, fmtRain } from '$lib/formats';
    import ChartDaily from './_partials/ChartDaily.svelte';
    import ChartYearly from './_partials/ChartYearly.svelte';
    import TopInfo from './_partials/TopInfo.svelte';
    import InfoBox from './_partials/InfoBox.svelte';

    export let station;
    export let data;
    export let monthlyStats;

    $: today = data.find(d => d.date - $maxDate < 1000);

    $: curMonth = today.date.getMonth();
    $: curMonthName = dayjs(today.date).format('MMMM');

    $: curYear = today.date.getFullYear();

    function moveDate(delta, by) {
        // console.log('move', delta, dayjs(today.date).add(delta, 'day').toDate())
        $maxDate = dayjs(today.date).add(delta, by).toDate();
    }

    $: numYears = $innerWidth < 550 ? 20 : 40;

    let monthlyData = [];
    $: {
        monthlyData = monthlyStats[curMonth].stats.slice(0);
        console.log(monthlyData[0]);
    }

    let copySentence;

    let trendTemp=0;
    let trendPrecip=0;
</script>

{#if data.length}
    <TopInfo {station} {today} bind:copySentence />
{/if}

<div class="paragraph_content">
    <p>
        Auf dieser Seite erfährst du, ob das Wetter in deiner Region mit dem der letzten Jahrzehnte
        vergleichbar ist – oder davon abweicht. Genauer genommen vergleichen wir das aktuelle Wetter
        mit dem Zeitraum 1961-1990, weil dieser Zeitraum noch wenig vom Klimawandel betroffen war
        und als internationaler Referenzzeitraum gilt.
    </p>

    <p>
        Manchmal überschätzen wir das Wetter als Ausreißer – und langfristige Veränderungen, die
        weniger spürbar sind, bleiben eher verborgen. Das wollen wir mit dieser Seite ändern.
    </p>
</div>

<h3>
    🌡️ So {today.TXK < today.context.TXK_lo ? 'kalt' : 'warm'} ist es gerade in <u>{station.name}</u> im Vergleich
    zu einer Zeit, die noch wenig vom Klimawandel betroffen war
</h3>

<figure>
    <ChartDaily
        unit="°C"
        label="Tageshöchst-\ntemperatur in °C"
        {data}
        yMin={-5}
        yMax={30}
        show="TXK"
    />
</figure>

<div class="paragraph_content">
    <p>{copySentence}</p>
</div>

<InfoBox />

<hr />

<!-- <p>Wir vergleichen die aktuellen Werte mit den Jahren {baseMinYear}-{baseMinYear+29}. Sie waren noch kaum von der Erdwärmung betroffen. Daher gilt dieser Zeitraum als offizieller Vergleichspunkt für Veränderungen durch den Klimawandel.</p> -->

<h3>
    🌧️ So {today.rain30days < today.context.rain30days_lo ? 'wenig' : 'viel'} regnet es momentan in <u>{station.name}</u> im Vergleich
    zu einer Zeit, die noch wenig vom Klimawandel betroffen war
</h3>

<figure>
    <ChartDaily
        label="Niederschlagsmenge\nkummuliert über 30 Tage"
        unit="mm"
        {data}
        includeZero={true}
        ymax={80}
        show="rain30days"
    />
</figure>

<div class="paragraph_content">
    <p>
        Über die vergangenen 30 Tage hat es {fmtRain(today.rain30days, true)} je Quadratmeter geregnet.
        Das ist {today.rain30days > today.context.rain30days_hi
            ? 'besonders viel'
            : today.rain30days < today.context.rain30days_lo
            ? 'besonders wenig'
            : 'normal'}{#if today.rain30days < today.context.rain30days_lo || today.rain30days > today.context.rain30days_hi}
            und etwa {fmtRain(
                Math.round(
                    Math.abs(
                        today.rain30days -
                            (today.rain30days < today.context.rain30days_lo
                                ? today.context.rain30days_lo
                                : today.context.rain30days_hi)
                    )
                ),
                true
            )}/qm {today.rain30days < today.context.rain30days_lo ? 'weniger' : 'mehr'} als im Vergleich
            zum Referenzzeitraum.{:else}.{/if}
    </p>

    <p>
        Ein Punkt auf der Niederschlagslinie steht nicht für die Niederschlagsmenge an diesem Tag,
        sondern für den gesammelten Niederschlag der letzten 30 Tage. Da hat einen guten Grund:
        Einzelne Regentage unterliegen sehr starken Schwankungen. Das betrifft sowohl die Regenmenge
        pro Regentag als auch die Häufigkeit der Regentage in einem Monat oder sogar in einem Jahr.
        Wir stellen deshalb in unserem Diagramm dar, wie viel Niederschlag kumuliert (das heißt:
        gehäuft) über die vergangenen 30 Tage gefallen ist. Diesen Wert vergleichen wir mit dem
        Referenzzeitraum 1961-1990.
    </p>
</div>
<hr />
<div class="paragraph_content">
    <p>
        <strong>☝️ Wichtig:</strong> Ausreißer wie punktuell viel Regen oder hohe Temperaturen sind beim
        aktuellen Wetter erstmal nicht ungewöhnlich. Denn das Wetter unterliegt ständigen Schwankungen.
        Erst wenn ein Monat überdurchschnittlich oft – also mehrere Jahre in Folge – vom langjährigen
        Klimadurchschnitt abweicht, kann man sicher sein, dass die Erderwärmung die Ursache dafür ist.
        Also erst wenn es im langfristigen Trend immer wärmer, und je nach Jahreszeit nasser oder trockener
        wird, können wir sagen: Das ist nicht einfach nur Wetter, das ist Klimawandel.
    </p>

    <p>Genau das zeigen die folgenden Diagramme.</p>
</div>

<hr />

<h3>
    🌡️ So warm war der <u>{curMonthName}</u> in <u>{station.name}</u> die letzten {numYears} Jahre
</h3>

{#if monthlyStats}
    <figure style="position: relative;">
        <img
            width="30"
            alt=""
            src="https://data.wdr.de/quarks-klima-wetter/static/thermometer.svg"
            style="position: absolute; left: -50px;width:30px;top:50px"
        />
        <ChartYearly
            month={curMonth}
            data={monthlyData}
            context={monthlyStats[curMonth].base}
            includeZero={true}
            bind:trend={trendTemp}
            {numYears}
            label="Durchschnittliche\nTageshöchsttemperatur\nim {curMonthName} in °C"
            unit="°C"
            show="temp"
        />
        <figcaption>
            Hinweis: Der Balken für den {curMonthName}
            {curYear} bildet nur Tage ab, an denen bisher Werte gemessen wurden.
        </figcaption>
    </figure>
    <div class="paragraph_content">
        <p>
            Je mehr Monate wärmer sind als der Referenzzeitraum von 1961-1990, desto steiler ist die <strong
            />Trendlinie, die hier das lokale Ausmaß der Erderwärmung anzeigt. Für den Monat {curMonthName}
            in {station.name} liegt der Trend gerade bei {fmtTemp(+(trendTemp.toFixed(1)))} Erwärmung (seit 1961). Damit liegen wir hier {trendTemp > 1.5 ? 'über' : trendTemp < 1.5 ? 'unter' : 'genau bei'}
            den 1,5°C, auf die die Erderwärmung weltweit betrachtet idealerweise begrenzt werden soll.
        </p>
    </div>
{/if}

<h3>
    🌧️ So viel hat es im <u>{curMonthName}</u> in <u>{station.name}</u> die letzten {numYears} Jahre
    geregnet
</h3>

{#if monthlyStats}
    <figure>
        <ChartYearly
            label="Monatssumme der\nNiederschlagshöhe im {curMonthName} (mm)"
            month={curMonth}
            data={monthlyData}
            context={monthlyStats[curMonth].base}
            includeZero={true}
            {numYears}
            bind:trend={trendPrecip}
            unit="mm"
            show="precip"
        />
        <figcaption>
            Hinweis: In den Balken für den {curMonthName}
            {curYear} sind nur Daten bis zum heutigen Tag eingeschlossen.
        </figcaption>
    </figure>
{/if}
{trendPrecip}
<div class="paragraph_content">
    <p>
        Fällt die Trendlinie ab, heißt das, dass dieser Monat immer trockener wird im Vergleich zum
        Referenzzeitraum von 1961-1990. Steigt sie an, heißt das, dass es häufiger regnet als im
        Vergleich zum Referenzzeitraum.
    </p>

    <p>
        Wenn die Niederschlagsmengen außergewöhnlich oft vom Mittel abweichen, ist das auf die
        Erderwärmung zurückzuführen. Die Erderwärmung geht insgesamt mit einer Verschiebung des
        Niederschlags einher. Punktuell extrem heftige Niederschläge können zwar häufiger auftreten,
        doch insgesamt regnet es im Sommer immer weniger. Die Winter werden dafür feuchter, es
        regnet mehr.
    </p>
</div>


