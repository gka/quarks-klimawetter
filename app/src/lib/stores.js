import { writable, derived } from 'svelte/store';
import dayjs from 'dayjs';
import 'dayjs/locale/de.js';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';

dayjs.extend(localizedFormat);
dayjs.locale('de');

export const maxDate = writable(new Date());

export const innerWidth = writable(1000);
export const chartWidth = writable(720);

export const isMobile = derived(chartWidth, $cw => $cw < 500);
export const showDays = derived(isMobile, $isMobile => ($isMobile ? 30 : 60));

export const minDate = derived([maxDate, showDays], ([$a, $showDays]) => {
    return new Date($a.getTime() - $showDays * 864e5);
});
