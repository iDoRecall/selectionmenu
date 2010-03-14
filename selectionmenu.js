// Erzeuge einen privaten Scope durch eine anonyme Funktion,
// speichere den Rückgabwert in einer globalen Variable
var SelectionMenu = (function () {
	
	var id = 'selection-menu';
	var span = null;
	
	// Geteilte private Helferfunktionen
	
	function addEvent (obj, type, fn) {
		// Fähigkeitenweiche W3C-DOM / Microsoft
		if (obj.addEventListener) {
			obj.addEventListener(type, fn, false);
		} else if (obj.attachEvent) {
			obj.attachEvent('on' + type, function () {
				return fn.call(obj, window.event);
			});
		}
	}
	
	// Mache addEvent als statische Methode öffentlich
	// (hefte die Methode an den Konstruktor, der zurückgegeben wird)
	SelectionMenu.addEvent = addEvent;
	
	function getSelection () {
		// Fähigkeitenweiche Mozilla / Microsoft
		if (window.getSelection) {
			return window.getSelection();
		} else if (document.selection && document.selection.createRange) {
			return document.selection.createRange();
		} else {
			// Keine Unterstützung
			return false;
		}
	}
	
	function getSelectedText (selection) {
		// Fähigkeitenweiche Mozilla / Microsoft
		return selection.toString ? selection.toString() : selection.text;
	}
	
	function contains (a, b) {
		// Fähigkeitenweiche Microsoft / Mozilla
		return a.contains ? a.contains(b) : !!(a.compareDocumentPosition(b) & 16);
	}
	
	function mouseOnMenu (e) {
		// Greife auf das Zielelement des Ereignisses zu
		// Fähigkeitenweiche W3C-DOM / Microsoft
		var target = e.target || e.srcElement;
		// Ist das Zielelement das Menü oder darin enthalten?
		return target == span || contains(span, target);
	}
	
	// Konstruktorfunktion
	
	function SelectionMenu (options) {
		var instance = this;
		
		// Kopiere Einstellungen aus dem options-Objekt herüber zur Instanz
		instance.menuHTML = options.menuHTML;
		instance.minimalSelection = options.minimalSelection || 5;
		instance.container = options.container;
		instance.handler = options.handler;
		
		// Initialisiere
		instance.create();
		instance.setupEvents();
	}
	
	SelectionMenu.prototype = {
		
		create : function () {
			var instance = this;
			
			// Erzeuge den Menü-Container, wenn noch nicht passiert
			if (span) {
				return;
			}
			
			span = document.createElement('span');
			span.id = id;
		},
		
		setupEvents : function () {
			
			var instance = this;
			var container = instance.container;
			
			// Verstecke beim Mousedown
			addEvent(container, 'mousedown', function (e) {
				instance.hide(e);
			});
			
			// Füge ein beim Mouseup (wenn Text ausgewählt wurde)
			addEvent(container, 'mouseup', function (e) {
				instance.insert(e);
				
				// Prüfe nach einer Verzögerung, ob in die vorhandene Auswahl
				// angeklickt wurde und die Auswahl damit aufgehoben wurde
				window.setTimeout(function () {
					instance.hideIfNoSelection();
				}, 1);
				
			});
			
			instance.setupMenuEvents();
		},
		
		setupMenuEvents : function () {
			var instance = this;
			
			// Registiere Handlerfunktion für den Klick auf das Menü
			addEvent(span, 'click', function (e) {
				instance.handler.call(instance, e);
				return false;
			});
			
			// Verhindere das Markieren des Menüs im IE
			addEvent(span, 'selectstart',  function () { 
				return false;
			});
		},
		
		hide : function (e) {
			// Breche ab, wenn Event-Objekt übergeben wurde und der Klick beim Menü passierte
			if (e && mouseOnMenu(e)) {
				return;
			}
			// Ist das Element in den DOM-Baum gehängt?
			var parent = span.parentNode;
			if (parent) {
				// Entferne es aus dem DOM-Baum (Element bleibt im Speicher erhalten
				// und wird später wiederverwendet)
				parent.removeChild(span);
			}
		},
		
		hideIfNoSelection : function () {
			var instance = this;
			var selection = getSelection();
			if (!selection) {
				return;
			}
			var selectedText = getSelectedText(selection);
			if (!selectedText.length) {
				instance.hide();
			}
		},
		
		insert : function (e) {
			var instance = this;
			
			// Breche ab, wenn das Mausereignis beim Menü passierte
			if (mouseOnMenu(e)) {
				return;
			}
			
			// Hole Selection bzw. TextRange (IE)
			var selection = getSelection();
			if (!selection) {
				// Keine Unterstützung
				return;
			}
			
			// Hole markierten Text
			var selectedText = getSelectedText(selection);
			instance.selectedText = selectedText;
			
			// Breche ab, wenn der markierte Text zu kurz ist
			if (selectedText.length < instance.minimalSelection) {
				instance.hide(e);
				return;
			}
			
			// Fähigkeitenweiche Mozilla / Microsoft
			if (selection.getRangeAt) {
				
				// Hole Range, die zur Selection gehört
				var range = selection.getRangeAt(0);
				
				// Erzeuge neue (leere) Range
				var newRange = document.createRange();
				// Verschiebe Anfang der neuen Range an das Ende der Auswahl
				var order = selection.anchorNode.compareDocumentPosition(selection.focusNode);
				if (order & 2) {
					newRange.setStart(selection.anchorNode, range.endOffset);
				} else {
					newRange.setStart(selection.focusNode, range.endOffset);
				}
				
				// Befülle Menü-Span
				span.innerHTML = instance.menuHTML;
				newRange.insertNode(span);
				
			} else if (selection.duplicate) {
				
				// Kopiere TextRange
				var newRange = selection.duplicate();
				// Verschiebe Anfang der neuen Range an das Ende der Auswahl
				newRange.setEndPoint('StartToEnd', selection);
				console.log("htmlText: " + selection.htmlText + "\ntext" + selection.text);
				
				// Befülle Menü-Span
				span.innerHTML = instance.menuHTML;
				newRange.pasteHTML(span.outerHTML);
				
				// Da das Befüllen nicht über das DOM, sondern über serialisierten HTML-Code erfolgt,
				// stellen wir die Referenz wieder her sowie den Event-Handler
				span = document.getElementById(id);
				instance.setupMenuEvents();
				
			} else {
				// Keine Unterstützung
				return;
			}
			
			// Positioniere Menü
			instance.position();
		},
		
		position : function () {
			span.style.marginTop = -(span.offsetHeight + 5) + 'px';
		}
	};
	
	// Gebe Konstruktor zurück
	return SelectionMenu;
})();