'use strict';

// base class ElementCreator with newElement()
// class WindowMounterr which inherits from base
// class Cardset which works with cards

class DomMaker {
  constructor() {
    // make the new mainElement which will be the parent of everything

    this.mainElement = this.newElement('div', null, {
      parentElement: document.body,
      class: 'main-element',
    });

    this.cardList = [];
    this.popupList = [];

    this.addButton = this.newElement('button', 'add a thing!', {
      class: 'options-add-btn',
    });

    this.modifyButton = this.newElement('button', 'modify button', {
      class: 'options-modify-btn',
    });

    this.options = this.newElement(
      'div',
      [this.addButton, this.modifyButton],
      {}
    );

    this.menu = this.newPopup(this.options, false);

    this.openMenuBtn = this.newElement('button', 'menu', {
      class: 'open-menu-btn',
      parentElement: this.mainElement,
    });
    this.closeMenuBtn = this.newElement('button', 'close', {
      class: 'close-menu-btn',
      parentElement: this.menu,
    });

    this.openMenuBtn.addEventListener('click', this.toggleMenu.bind(this));
    this.closeMenuBtn.addEventListener('click', this.toggleMenu.bind(this));

    this.menuShown = false;
  }

  appendElement(automount, parent, element) {
    // true -> append to the default element
    if (automount === true) this.mainElement.appendChild(element);
    else if (
      typeof parent === 'object' &&
      typeof parent.appendChild === 'function' &&
      typeof element === 'object' &&
      typeof element.appendChild === 'function'
    )
      // can append
      parent.appendChild(element);
  }

  newElement(elementType, content, propertiesObj) {
    if (typeof elementType !== 'string') {
      return false;
    }

    const element = document.createElement(elementType);

    // IIFE recursive function lol
    (function recursiveCheck(content, layer = 0, maxLayer = 3) {
      if (layer >= maxLayer) return false;
      if (content) {
        if (typeof content === 'string')
          // valid argument for innerHTML
          element.innerHTML = content;
        else if (
          typeof content === 'object' &&
          typeof content.appendChild === 'function'
        )
          // valid DOM node inside
          element.appendChild(content);
        else if (typeof content === 'object') {
          //run the function for each key

          const keys = Object.keys(content);

          for (let i = 0; i < keys.length; i++)
            recursiveCheck(content[keys[i]], layer++); // check inside the object
        } else if (Array.isArray(content)) {
          // run for each element

          for (let i = 0; i < keys.length; i++)
            recursiveCheck(content[keys[i]], layer++); // check inside the array
        }
      }
    })(content, 0, 3);

    if (!propertiesObj) {
      return element; // we're done
    }

    // add props
    const keys = Object.keys(propertiesObj);

    for (let i = 0; i < keys.length; i++) {
      if (typeof propertiesObj[keys[i]] !== 'string' && keys[i] !== 'style')
        continue;

      // check for styles
      if (keys[i] === 'style') {
        // it's a style object
        console.log(propertiesObj.style);

        const styleKeys = Object.keys(propertiesObj.style);

        for (let j = 0; j < styleKeys.length; j++) {
          element.style[styleKeys[j]] = propertiesObj.style[styleKeys[j]];
        }
      } else element.setAttribute(keys[i], propertiesObj[keys[i]]); //style.width etc
    }

    if (propertiesObj.hasOwnProperty('parentElement'))
      this.appendElement(false, propertiesObj.parentElement, element);

    return element;
  }

  newCard(word, example, definition, automound, parent) {
    const card = this.newElement('div', null, {
      class: 'card',
    });

    const wordElement = this.newElement('h1', word, {
      class: 'card-title',
      parentElement: card,
    });

    const exampleElement = this.newElement('p', example, {
      class: 'card-example',
      parentElement: card,
    });

    //defintion not appended at first
    const definitionElement = this.newElement('p', definition, {
      class: 'card-definition',
    });

    this.appendElement(automound, parent, card);

    card.flipped = true;

    card.addEventListener('click', () => {
      if (card.flipped) {
        card.removeChild(wordElement);
        card.removeChild(exampleElement);

        card.appendChild(definitionElement);
      } else {
        card.removeChild(definitionElement);

        card.appendChild(wordElement);
        card.appendChild(exampleElement);
      }

      card.flipped = !card.flipped;
    });

    this.cardList.push(card);

    return card;
  }

  newPopup(contents, automount, parent) {
    const popup = this.newElement('div', contents, {
      class: 'popup-window',
    });

    this.appendElement(automount, parent, popup);

    this.popupList.push(popup);

    return popup;
  }

  toggleMenu() {
    if (!this.menuShown) {
      // blur and disable the rest this.mainElement
      // this points to the button that called the function
      // BUG the background doesn't get disabled
      this.mainElement.disabled = true;
      this.mainElement.classList.add('blurred');

      // append menu this.menu
      document.body.appendChild(this.menu);
    } else {
      // remove menu
      document.body.removeChild(this.menu);

      // remove blur and disability
      this.mainElement.disabled = false;
      this.mainElement.classList.remove('blurred');
    }

    this.menuShown = !this.menuShown;
  }
}

const creator = new DomMaker();

const card1 = creator.newCard(
  'word',
  'this is an example setence',
  'this is the definition of the word',
  true
);

const x = creator.newElement('h1', 'hello', {});
const y = creator.newElement('h2', 'more content', {});

creator.newElement(
  'div',
  {
    x,
    y,
  },
  {}
);

// TODO
// link menu to some button or something
// menu - add, modify, delete notes
