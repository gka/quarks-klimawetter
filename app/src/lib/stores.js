import { writable, derived } from 'svelte/store';
import dayjs from 'dayjs';
import 'dayjs/locale/de.js';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';

dayjs.extend(localizedFormat);
dayjs.locale('de');

export const maxDate = writable(new Date(2021,5,19));

export const innerWidth = writable(1000);
export const chartWidth = writable(720);

export const showDays = derived(innerWidth, $cw => ($cw < 500 ? 30 : 60));

export const minDate = derived([maxDate, showDays], ([$a, $showDays]) => {
    return new Date($a.getTime() - $showDays * 864e5);
});
