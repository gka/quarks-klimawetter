<script>
    import dayjs from 'dayjs';
    import { maxDate, innerWidth } from '$lib/stores';
    import { fmtTemp, fmtRain } from '$lib/formats';
    import ChartDaily from './_partials/ChartDaily.svelte';
    import ChartYearly from './_partials/ChartYearly.svelte';
    import TopInfo from './_partials/TopInfo.svelte';
    import InfoBox from './_partials/InfoBox.svelte';
    import Section from './_partials/Section.svelte';

    export let station;
    export let data;
    export let monthlyStats;

    $: curDay = data.find(
        d => dayjs($maxDate).format('YYYY-MM-DD') === dayjs(d.date).format('YYYY-MM-DD')
    );

    $: curMonth = curDay.date.getMonth();
    $: curMonthName = dayjs(curDay.date).format('MMMM');

    $: curYear = curDay.date.getFullYear();

    function moveDate(delta, by) {
        $maxDate = dayjs(curDay.date).add(delta, by).toDate();
    }

    $: numYears = $innerWidth < 550 ? 20 : 40;

    let monthlyData = [];
    $: {
        monthlyData = monthlyStats[curMonth].stats.slice(0);
    }

    let copySentence;

    let trendTemp = 0;
    let trendPrecip = 0;
    let tempHistHeight;
</script>

<div class="quarks-wetterklima">
    {#if data.length}
        <Section nopadding>
            <TopInfo {station} {curDay} bind:copySentence />
        </Section>
    {/if}

    <Section gray>
        <div class="paragraph_content">
            <p>
                Auf dieser Seite erfährst du, ob das aktuelle Wetter in deiner Region mit dem der
                letzten Jahrzehnte vergleichbar ist – oder davon abweicht. Genauer genommen
                vergleichen wir das aktuelle Wetter mit dem Zeitraum 1961-1990, weil dieser Zeitraum
                noch wenig vom menschengemachten Klimawandel betroffen war und als internationaler
                Referenzzeitraum gilt.
            </p>

            <p>
                Manchmal überschätzen wir das Wetter als Ausreißer – und langfristige Veränderungen,
                die weniger spürbar sind, bleiben eher verborgen. Das wollen wir mit dieser Seite
                ändern.
            </p>
        </div>
    </Section>

    <Section>
        <h3>
            🌡️ So {curDay.TXK < curDay.context.TXK_lo ? 'kalt' : 'warm'} ist es momentan {station.prep}
            <u>{station.name}</u> im Vergleich zu einer Zeit, die noch wenig vom Klimawandel betroffen
            war
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

        {#if copySentence}
            <div class="paragraph_content">
                <p>{copySentence}</p>
            </div>
        {/if}

        <InfoBox />

        <div class="paragraph_headline" style="margin-top: 70px;">
            <h3>
                🌧️ So {curDay.rain30days < curDay.context.rain30days_lo ? 'wenig' : 'viel'} regnet es
                momentan
                {station.prep} <u>{station.name}</u> im Vergleich zu einer Zeit, die noch wenig vom Klimawandel
                betroffen war
            </h3>
        </div>

        <figure>
            <ChartDaily
                label="Niederschlagsmenge je qm\nkumuliert über 30 Tage in mm"
                unit="mm"
                {data}
                includeZero={true}
                ymax={80}
                show="rain30days"
            />
        </figure>

        <div class="paragraph_content">
            <p>
                Über die vergangenen 30 Tage hat es {fmtRain(curDay.rain30days, true)} je Quadratmeter
                geregnet. Das ist {curDay.rain30days > curDay.context.rain30days_hi
                    ? 'besonders viel '
                    : curDay.rain30days < curDay.context.rain30days_lo
                    ? 'besonders wenig '
                    : 'normal'}{#if curDay.rain30days < curDay.context.rain30days_lo || curDay.rain30days > curDay.context.rain30days_hi}
                    und etwa {fmtRain(
                        Math.round(
                            Math.abs(
                                curDay.rain30days -
                                    (curDay.rain30days < curDay.context.rain30days_lo
                                        ? curDay.context.rain30days_lo
                                        : curDay.context.rain30days_hi)
                            )
                        ),
                        true
                    )}/qm {curDay.rain30days < curDay.context.rain30days_lo ? 'weniger' : 'mehr'} als
                    im Referenzzeitraum.{:else}.{/if}
            </p>
        </div>
    </Section>

    <Section gray>
        <div class="paragraph_content">
            <p>
                Ein Punkt auf der Niederschlagslinie steht nicht für die Niederschlagsmenge an
                diesem Tag, sondern für den gesammelten Niederschlag der letzten 30 Tage. Das hat
                einen guten Grund: Einzelne Regentage unterliegen sehr starken Schwankungen. Das
                betrifft sowohl die Regenmenge pro Regentag als auch die Häufigkeit der Regentage in
                einem Monat oder sogar in einem Jahr. Wir stellen deshalb in unserem Diagramm dar,
                wie viel Niederschlag kumuliert (das heißt: gehäuft) über die vergangenen 30 Tage
                gefallen ist. Diesen Wert vergleichen wir mit dem Referenzzeitraum 1961-1990.
            </p>
        </div>

        <div class="paragraph_headline" style="margin-bottom: 30px;">
            <h2>
                <font color="35beed">Aber: Erst langfristige Trends zeigen den Klimawandel</font>
            </h2>
        </div>

        <div class="paragraph_content">
            <p>
                Ausreißer wie punktuell viel Regen oder hohe Temperaturen sind beim aktuellen Wetter
                erstmal nicht ungewöhnlich. Denn das Wetter unterliegt ständigen Schwankungen. Erst
                wenn ein Monat überdurchschnittlich oft – also mehrere Jahre in Folge – vom
                langjährigen Klimadurchschnitt abweicht, kann man sicher sein, dass die Erderwärmung
                die Ursache dafür ist. Also erst wenn es im langfristigen Trend immer wärmer, und je
                nach Jahreszeit nasser oder trockener wird, können wir sagen: Das ist nicht einfach
                nur Wetter, das ist Klimawandel.
            </p>

            <p>Genau das zeigen die folgenden Diagramme.</p>
        </div>
    </Section>

    {#if monthlyStats}
        <Section>
            <h3>
                🌡️ So warm war der <u>{curMonthName}</u>
                {station.prep} <u>{station.name}</u> die letzten {numYears} Jahre
            </h3>

            <figure style="position: relative;">
                <img
                    alt=""
                    src="https://data.wdr.de/quarks-klima-wetter/static/thermometer.svg"
                    style="position: absolute; left: -60px;height:{tempHistHeight}px;top:-13px"
                />
                <ChartYearly
                    month={curMonth}
                    bind:height={tempHistHeight}
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
                    Der hellgraue Bereich zeigt die normalen Tageshöchsttemperaturen (1961-1991) im {curMonthName}
                    ({fmtTemp(monthlyStats[curMonth].base.temp_lo, true)}-{fmtTemp(
                        monthlyStats[curMonth].base.temp_hi,
                        true
                    )}). Hinweis: Der letzte Balken für den {curMonthName}
                    {curYear} bildet nur Tage ab, an denen bisher Werte gemessen wurden. Deshalb fließt
                    dieser Monat noch nicht in den linearen Trend mit ein.
                </figcaption>
            </figure>
        </Section>

        <Section gray>
            <div class="paragraph_content">
                <p>
                    Je mehr Monate wärmer sind als der Referenzzeitraum von 1961-1990, desto steiler
                    ist die <strong>Trendlinie</strong>, die hier das lokale Ausmaß der Erwärmung
                    anzeigt. Für den Monat {curMonthName}
                    in {station.name} liegt der lineare Trend gerade bei {fmtTemp(
                        +trendTemp.toFixed(1)
                    )} Erwärmung (seit 1961).
                </p>
                <p>
                    Wichtig: Dieser Wert kann nicht mit dem globalen Ziel von höchstens
                    1,5°C-Erderwärmung verglichen werden. Letzterer bezieht sich auf die
                    Erderwärmung seit 1881. (Den Zeitraum können wir in unserer Grafik jedoch nicht
                    verwenden, weil es damals noch kaum Wetterstationen gab.)
                </p>
            </div>
        </Section>
    {/if}

    {#if monthlyStats}
        <Section>
            <h3>
                🌧️ So viel hat es im <u>{curMonthName}</u>
                {station.prep} <u>{station.name}</u> die letzten {numYears} Jahre geregnet
            </h3>

            <figure>
                <ChartYearly
                    label="Monatssumme der\nNiederschlagshöhe\nim {curMonthName} in mm"
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
                    Der hellgraue Bereich zeigt die normalen Monatsniederschläge im {curMonthName} ({fmtRain(
                        monthlyStats[curMonth].base.precip_lo,
                        true
                    )}-{fmtRain(monthlyStats[curMonth].base.precip_hi, true)}). Hinweis: Im letzten
                    Balken für den {curMonthName}
                    {curYear} sind nur Daten bis zum heutigen Tag eingeschlossen. Deshalb fließt dieser
                    Monat noch nicht in den linearen Trend mit ein.
                </figcaption>
            </figure>
        </Section>
    {/if}
    <Section gray>
        <div class="paragraph_content">
            <p>
                Fällt die Trendlinie ab, heißt das: Dieser Monat wird immer trockener im Vergleich
                zum Referenzzeitraum von 1961-1990. Steigt sie an, heißt das: Es regnet häufiger als
                im Referenzzeitraum.
            </p>

            <p>
                Wenn die Niederschlagsmengen außergewöhnlich oft vom Mittel abweichen, ist das auf
                die Erderwärmung zurückzuführen. Die Erderwärmung geht insgesamt mit einer
                Verschiebung des Niederschlags einher. Punktuell extrem heftige Niederschläge können
                zwar häufiger auftreten, doch insgesamt regnet es im Sommer immer weniger. Die
                Winter werden dafür feuchter, es regnet mehr.
            </p>
        </div>
    </Section>
</div>

<style>
    figcaption {
        font-size: 14px;
        color: var(--gray-dark);
        margin-bottom: 40px;
    }

    .quarks-wetterklima :global(.is-bold) {
        font-weight: bold;
        font-family: sans_bold;
    }

    h3 {
        margin-top: 3rem;
        margin-bottom: 2rem;
    }

    @media (max-width: 767px) {
        h2 {
            margin-top: 2rem;
        }
    }
</style>
