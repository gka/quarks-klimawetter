import { writable, derived } from 'svelte/store';
import { timeMonth, timeDay } from 'd3-time';
import { scaleLinear } from 'd3-scale';


export const maxDate = writable(new Date());

export const innerWidth = writable(1000);
export const chartWidth = writable(1000);

export const showDays = derived(chartWidth, $cw =>
    60 //$cw < 500 ? 180 : Math.max(365, Math.round(($cw - 50) / 4))
);

export const minDate = derived([maxDate, chartWidth, showDays], ([$a, $cw, $showDays]) => {
    const approxDays = $showDays;
    // compute exact days to match days
    const lastD = timeMonth.ceil($a);
    const minD = timeMonth.floor(new Date(lastD.getTime() - approxDays * 864e5));
    const days = timeDay.count(minD, lastD);
    return new Date($a.getTime() - days * 864e5);
});