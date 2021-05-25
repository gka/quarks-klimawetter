<script>
    import { fmtTemp, fmtRain } from '$lib/formats';
    import { minDate, maxDate } from '$lib/stores';
    import dayjs from 'dayjs';

    export let station;
    export let today;
    export let context;

    $: tempSentence = today.TXK > context[today.day].TXK_hi ? 'überdurchschnittlich warm' :
        today.TXK < context[today.day].TXK_lo ? 'überdurchschnittlich kalt' :
        'normal warm';

    $: precipSentence = today.rain30days > context[today.day].rain30days * 1.1 ? 'überdurchschnittlich viel' :
        today.rain30days < context[today.day].rain30days * 0.9 ? 'überdurchschnittlich wenig' :
        'normal viel';
</script>

<style>
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