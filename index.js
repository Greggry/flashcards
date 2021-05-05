'use strict';

class DomMaker {
  constructor() {
    // make the new mainElement which will be the parent of everything

    this.mainElement = this.newElement('div', null, {
      parentElement: document.body,
      class: 'main-element',
    });

    this.cardList = [];
    this.modalList = [];

    this.addButton = this.newElement('button', 'add a thing!', {
      class: 'options-add-btn',
      click: this.newCardModal.bind(this),
    });
    this.modifyButton = this.newElement('button', 'modify button', {
      class: 'options-modify-btn',
    });

    this.options = this.newElement(
      'div',
      [this.addButton, this.modifyButton],
      {}
    );

    this.sidePane = this.newElement('div', ['<h1>options</h1>', this.options], {
      class: 'side-pane',
      parentElement: this.mainElement,
    });

    this.settings = this.newModal('these are settings', false);

    this.openSettingsBtn = this.newElement('button', 'settings', {
      class: 'open-settings-btn',
      parentElement: this.sidePane,
    });
    this.closeSettingsBtn = this.newElement('button', 'close', {
      class: 'close-settings-btn',
      parentElement: this.settings,
    });

    this.openSettingsBtn.addEventListener(
      'click',
      this.toggleSettings.bind(this)
    );
    this.closeSettingsBtn.addEventListener(
      'click',
      this.toggleSettings.bind(this)
    );

    this.settingsShown = false;
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
    (function recursiveCheckAssignContent(content, layer = 0, maxLayer = 3) {
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
            recursiveCheckAssignContent(content[keys[i]], layer++); // check inside the object
        } else if (Array.isArray(content)) {
          // run for each element

          for (let i = 0; i < keys.length; i++)
            recursiveCheckAssignContent(content[keys[i]], layer++); // check inside the array
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

    if (propertiesObj.hasOwnProperty('click'))
      element.addEventListener('click', propertiesObj['click']);

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

  newModal(contents, automount, parent) {
    const modal = this.newElement('div', contents, {
      class: 'modal-window',
    });

    this.appendElement(automount, parent, modal);

    this.modalList.push(modal);

    return modal;
  }

  toggleSettings() {
    if (!this.settingsShown) {
      // add blur, disable
      this.toggleDisabledOnChildren('.main-element');
      this.mainElement.classList.add('blurred');

      // append this.settings
      document.body.appendChild(this.settings);
    } else {
      // remove settings
      document.body.removeChild(this.settings);

      // remove blur and enable elements back
      this.toggleDisabledOnChildren('.main-element');
      this.mainElement.classList.remove('blurred');
    }

    this.settingsShown = !this.settingsShown;
  }

  toggleDisabledOnChildren(parentSelector) {
    const childrenArray = document.querySelectorAll(`${parentSelector} *`);

    for (let i = 0; i < childrenArray.length; i++) {
      childrenArray[i].disabled = !childrenArray[i].disabled;
    }
  }

  newCardModal() {
    const modalContent = this.newElement('div', '', {});

    const modal = this.newModal(modalContent, false, document.body);
    this.toggleDisabledOnChildren('.main-element');

    const createLabels = labelText => {
      const textField = this.newElement('input', '', {
        type: 'text',
        class: 'card-input',
      });

      const labelTextElement = this.newElement('span', labelText, {
        class: 'label-text',
      });

      const labelElement = [
        this.newElement('label', [labelTextElement, textField], {
          parentElement: modalContent,
        }),
      ];

      return textField;
    };
    // three text input fields, a button to submit the input and a button to close the modal

    const wordInput = createLabels('word:');
    const exampleInput = createLabels('example:');
    const definitionInput = createLabels('definition:');

    const btnSubmit = this.newElement('button', 'submit', {
      class: 'btn-submit',
      parentElement: modalContent,
      click: () => {
        console.log(wordInput);
        this.newCard(
          wordInput.value,
          exampleInput.value,
          definitionInput.value,
          true
        );
      },
    });

    const btnCancel = this.newElement('button', 'cancel', {
      parentElement: modalContent,
      class: 'btn-cancel',
      click: () => {
        this.toggleDisabledOnChildren('.main-element');
        modal.remove();
      },
    });
  }
}

const maker = new DomMaker();

const card1 = maker.newCard(
  'word',
  'this is an example setence',
  'this is the definition of the word',
  true
);

// TODO
// settings
// a side pane on the left with options
// side pane - add modify delete etc
// the cards are the only keyboard unfriendly element
