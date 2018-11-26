import {TextInput, TextInputView} from "models/widgets/text_input"
import {InputWidgetView} from "models/widgets/input_widget"

import {empty, ul, li, a, div, Keys, label, input} from "core/dom"
import {clear_menus} from "core/menus"
import * as p from "core/properties"


// some code cannibalized from from https://www.w3schools.com/howto/howto_js_autocomplete.asp
export class RevisedAutocompleteView extends TextInputView {
  model: RevisedAutocomplete

  protected menuEl: HTMLElement

  connect_signals(): void {
    super.connect_signals()
  }

  render(): void {
    super.render()

    this.inputEl.classList.add("bk-autocomplete-input")
    this.el.classList.add("bk-autocomplete")

    this.inputEl.addEventListener("keydown", (event) => this._keydown(event))
    this.inputEl.addEventListener("keyup", (event) => this._keyup(event))

    this._currentFocus = -1
  }

  protected _render_items(completions: Any): void {
      var w, p, i, success;
      empty(this.menuEl)

      const val = this.inputEl.value
      var words = val.split(" ");
      if (words.length > 1) {
        success = this._render_multi_word(completions, val, words)
      }
      // Try to match start of word if no spaces in input
      else {
        success = this._render_one_word(completions, val, words)
      }
      if (!success) this._clear_menu()
  }

  protected _render_multi_word(completions: Any, val: String, words: string[]): void {
      var p: string, i: int, offset: int, phrases: string[], added_phrases: string[];

      // Get all phrases containing any of the user provided words
      phrases = [];
      for (i = 0; i < words.length - 1; i++) {
        added_phrases = [];
        if (words[i]) added_phrases = completions[words[i].toUpperCase()];
        if (added_phrases) phrases.concat(added_phrases);
      }
      phrases = new Set(phrases);
      if (!phrases.size) {return false;}

      // Set objects break for the ECMA15 Typescript target
      phrases = Array.from(phrases)
      for (p of phrases) {
        offset = p.toUpperCase().indexOf(val.toUpperCase());
        if (offset != -1) {
          this._add_autocomplete_item(this.menuEl, p, offset, val.length);
        }
      }
      return true;
  }

  protected _render_one_word(completions: Any, val: String, words: string[]): void {
      var w, p, offset, count = 0;
      for (w in completions) {
        /*check if the item starts with the same letters as the text field value:*/
        if (w.substr(0, val.length) == val.toUpperCase()) {
          for (p of completions[w]) {
            offset = p.toUpperCase().indexOf(w);
            this._add_autocomplete_item(this.menuEl, p, offset, val.length);
            count++
          }
        }
      }
      if (!count) {return false;}
      return true;
  }

  protected _add_autocomplete_item(menuEl: HTMLElement, phrase: string[], offset: int, length: int): void {
    // Display value with matched portion bolded
    var innerHTML = phrase.substr(0, offset);
    innerHTML += "<strong>" + phrase.substr(offset, length) + "</strong>";
    innerHTML += phrase.substr(offset + length);

    var itemEl = div({
      class: "bk-autocomplete-item",
    });
    itemEl.insertAdjacentHTML('beforeend', innerHTML);
    //itemEl.addEventListener("click", (event) => function(event: MouseEvent) {
    itemEl.addEventListener("click", function(event) {
        var inputEl = this.parentNode.previousElementSibling;
        inputEl.value = event.target.innerText;
        inputEl.blur();
    });
    menuEl.appendChild(itemEl);
  }

  protected _open_menu(): void {
    this.el.classList.add("bk-bs-open")
  }

  protected _clear_menu(): void {
    console.log('Closing')
    // Remove the menu and reset the focus to -1
    this.el.classList.remove("bk-bs-open");
    var menuEls = document.getElementsByClassName("bk-bs-dropdown-menu");
    for (var menu of menuEls) {
      menu.parentNode.removeChild(menu);
    }
    this._currentFocus = -1;
  }

  protected _addActive(menuElItems): void {
    /*a function to classify an item as "active":*/
    var x = menuElItems;
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    this._removeActive(x);
    if (this._currentFocus >= x.length) this._currentFocus = 0;
    if (this._currentFocus < 0) this._currentFocus = (x.length - 1);
    /*add class "bk-autocomplete-active":*/
    x[this._currentFocus].classList.add("bk-autocomplete-active");
  }

  protected _removeActive(x): void {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("bk-autocomplete-active");
    }
  }

  _keydown(event: KeyboardEvent): void {
    // To prevent default action, handle enter on keydown
    switch (event.keyCode) {
      case Keys.Enter: {
        var x;
        if (this.menuEl) x = this.menuEl.getElementsByTagName("div");
        event.preventDefault();
        if (this._currentFocus > -1) {
          /*simulate a click on the "active" item:*/
          if (x) x[this._currentFocus].click();
        }
        else {
          this.inputEl.blur();
        }
        break
      }
    }
  }

  _keyup(event: KeyboardEvent): void {
    var x;
    if (this.menuEl) x = this.menuEl.getElementsByTagName("div");

    switch (event.keyCode) {
      case Keys.Esc: {
        this._clear_menu()
        break
      }
      case Keys.Up: {
        if (x) {
          this._currentFocus--
          this._addActive(x)
        }
        break
      }
      case Keys.Down: {
        if (x) {
          this._currentFocus++
          this._addActive(x)
        }
        break
      }
      default: {  // Display/Update the completion menu
        this._clear_menu();

        this.menuEl = ul({class: "bk-bs-dropdown-menu"})
        this.el.appendChild(this.menuEl)
        if (this.inputEl.value.length < 1 || this.model.completions.length == 0) {
          this._clear_menu();
        }
        else {
          this._render_items(this.model.completions)
          this._open_menu()
        }
      }
    }
  }
}

export namespace RevisedAutocomplete {
  export interface Attrs extends TextInput.Attrs {
    completions: {}
  }

  export interface Props extends TextInput.Props {}
}

export interface RevisedAutocomplete extends RevisedAutocomplete.Attrs {}

export class RevisedAutocomplete extends TextInput {

  properties: RevisedAutocomplete.Props

  constructor(attrs?: Partial<RevisedAutocomplete.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "RevisedAutocomplete"
    this.prototype.default_view = RevisedAutocompleteView

    this.define({
      completions: [p.Any, {}],
    })

    this.internal({
      active: [p.Boolean, true],
    })
  }

  active: boolean
}

RevisedAutocomplete.initClass()
