<script context="module">
    import { csvParse } from 'd3-dsv';
    import dayjs from 'dayjs';
    import Chart from '../_partials/Chart.svelte';

    /**
     * @type {import('@sveltejs/kit').Load}
     */
    export async function load({ page, fetch, session, context }) {
        const res = await fetch('/stationen.json');
        const stationen = await res.json();

        const station = stationen.find(s => s.slug === page.params.slug);

        if (station) {
            const url = `https://data.vis4.net/dwd/stations/${station.id}-fc.csv`;
            const res2 = await fetch(url);
            if (!res2.ok) {
                return {
                    status: res.status,
                    error: new Error(`Could not load ${url}`)
                };
            }
            const resBody = await res2.text();
            const data = csvParse(resBody, d => ({
                date: new Date(d.date),
                year: new Date(d.date).getFullYear(),
                day: dayjs(d.date).format('MM-DD'),
                TXK: +d.TXK,
                RSK: +d.RSK
            }));

            return {
                props: {
                    data,
                    station
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
    // import dayjs from 'dayjs';
    import localizedFormat from 'dayjs/plugin/localizedFormat';
    import 'dayjs/locale/de';

    dayjs.extend(localizedFormat)
    dayjs.locale('de');

    export let station;
    export let data;

    let baseMinYear = 1991;

    let date = new Date();

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

    $: today = data.find(d => d.date - date < 10);

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
            let tempSum = 0;
            let tempRain = 0;
            dates.forEach(d => {
                tempSum += d.TXK;
                tempRain += d.rain30days;
            })
            return {
                day: fmt,
                TXK: tempSum / dates.length,
                rain30days: tempRain / dates.length
            }
        }
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

<h1>Ist das Wetter oder Klimawandel?</h1>

<Chart data="{dataLinked}" yscaleVar="RSK" />

<pre>{JSON.stringify(context, null, 2)}</pre>
<p>Heute ist es in {station.name}...</p>
<p>Heute ist es in {station.name}...</p>

<p>{dayjs(date).format('LL')}</p>
<p>max. {fmtTemp(today.TXK)}<br />{fmtRain(today.RSK)}</p>
{today}
{context[today.day]}

<h1>{station.name}</h1>
<h2>{station.state}</h2>
{station.id}