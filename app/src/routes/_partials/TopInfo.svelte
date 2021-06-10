<script>
    import { fmtTemp, fmtRain } from '$lib/formats';
    import { minDate, maxDate } from '$lib/stores';
    import dayjs from 'dayjs';

    export let station;
    export let today;

    $: tempSentence = today.TXK > today.context.TXK_hi ? 'überdurchschnittlich warm' :
        today.TXK < today.context.TXK_lo ? 'überdurchschnittlich kalt' :
        'durchschnittlich warm';

    $: precipSentence = today.rain30days > today.context.rain30days_hi ? 'überdurchschnittlich viel' :
        today.rain30days < today.context.rain30days_lo ? 'überdurchschnittlich wenig' :
        'durchschnittlich viel';

    $: tempClass = today.TXK > today.context.TXK_hi ? 'high' :
        today.TXK < today.context.TXK_lo ? 'low' :
        'normal';

    $: precipClass = today.rain30days > today.context.rain30days_hi ? 'high' :
        today.rain30days < today.context.rain30days_lo ? 'low' :
        'normal';
</script>

<style>
    .topinfo {

        font-size: 1.4rem;
    }
    .flex div {
        font-size: 1.2rem;
        width: 50%;
        text-align: center;
    }
    .flex {
        display: flex;
        width: 100%;
    }
    b {
        padding: 2px 4px;
        border-radius: 4px;
        display: inline;
    }
    .temp-high {
        background: #dc35453b;
    }
    .temp-low {
        background: #17a2b82b;
    }
    .rain-high {
        background: #007bff30;
    }
    .rain-low {
        background: #fd7e1442;
    }
</style>

<div class="topinfo">

    <div class="flex" style="margin-bottom: 2rem">
        <div >
            Heute ist es in {station.name} <b class="temp-{tempClass}">{tempSentence}</b>.<br>Außerdem <b class="rain-{precipClass}">regnet</b> es gerade (die letzten 30 Tage) <b class="rain-{precipClass}">{precipSentence}</b>.
         </div>
         <div>
             <b>{dayjs($maxDate).format('LL')}</b><br>
             max. {fmtTemp(today.TXK)}<br>
             {fmtRain(today.RSK)}<br>
         </div>
    </div>
    <hr />
    <div style="margin-top: 2rem">
        Heute ist es in {station.name} mit <strong>max. {fmtTemp(today.TXK)}</strong> <b class="temp-{tempClass}">{tempSentence}</b>. In den letzten 30 Tagen gab es <strong>{fmtRain(today.rain30days, true)} Niederschlag (je qm)</strong>, was gemessen am Vergleichszeitraum <b class="rain-{precipClass}">{precipSentence}</b> ist.
    </div>

</div>
