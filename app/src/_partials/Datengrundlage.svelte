<script>
	export let stationen;
</script>

<style type="text/css">
	h3 {
		color: var(--gray-dark);
		font-size: 23px;
	}
	p {
		color: var(--gray-dark);
		font-size: 17px;
	}
</style>

<h3 id="datengrundlage">Unsere Datengrundlage</h3>

<p>Alle Wetterdaten stammen aus dem <a href="https://www.dwd.de/DE/klimaumwelt/cdc/cdc_node.html">Climate Data Center</a> vom Deutschen Wetterdienst (DWD). Damit bilden wir die Prognose- und Messdaten von {stationen.length} Wetterstationen ab, die seit mindestens 1961 bis heute aktiv sind. Nicht alle Stationen stehen im Zentrum einer Stadt, manche etwas außerhalb, auf einer Anhöhe oder einem Berg. Es kann also sein, dass die von uns benutzten Messwerte (Temperatur, Niederschlag) von denen direkt vor deiner Haustür abweichen. </p>

<h4>Referenzperiode und Normalbereich</h4>

<p>Das 30-Jährige Mittel ist ein Referenzwert, um das aktuelle Wetter mit dem Zustand des Klimas zu vergleichen. Um natürliche Schwankungen auszugleichen fasst es das Wetter (Temperatur, Niederschlag usw.) über 30 Jahre hinweg in Durchschnittswerten zusammen.</p>

<p>Es gibt <a href="https://www.dwd.de/DE/leistungen/besondereereignisse/verschiedenes/20210119_neue_referenzperiode.html?nn=451634">verschiedene Perioden für 30-jährige Mittel</a>. Wir vergleichen das aktuelle Wetter mit dem Mittel der <strong>Jahre 1961-1990</strong>: Sie waren noch kaum von der Erderwärmung betroffen und gelten daher als offizielle Vergleichsperiode, um Veränderungen durch den Klimawandel aufzuzeigen. Noch präziser wäre die Periode 1881-1911, also die Zeit vor Industrialisierung; aus dieser Zeit gibt es aber viel weniger Messstationen und somit weniger nutzbare Daten.</p>

<p>Der <strong>graue Bereich</strong> in unseren Diagrammen zeigt also, welches Wetter (Temperatur/Niederschlag) von 1961-1990 am häufigsten war. Wir bezeichnen diesen Bereich als “normal”. Er bildet nicht nur die Durchschnittswerte aus der Referenzperiode ab, sondern jeweils die Werte vom <a href="https://www.dwd.de/DE/fachnutzer/landwirtschaft/dokumentationen/allgemein/perzentile_doku.html">25.-75. Perzentil</a>.</p>

<p>Ein <strong>Beispiel</strong>: Bildet man den Durchschnitt aller Tageshöchsttemperaturen, die am 1. August von 1961-1990 in Köln gemessen wurden, ergibt das 23,8°C. Es gab natürlich auch 1. Augusttage, die wärmer oder kälter waren. Der Großteil von ihnen streut um den Mittelwert in einem Bereich zwischen 20,5°C (25. Perzentil) und 26,6°C (75. Perzentil).</p>

