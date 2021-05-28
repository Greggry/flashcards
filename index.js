'use strict';

class DomMaker {
  constructor() {
    // make the new mainElement which will be the parent of everything
    this.mainElement = this.newElement('div', null, {
      parentElement: document.body,
      class: 'main-element',
    });

    this.cardMountpoint = this.newElement('div', null, {
      parentElement: this.mainElement,
      class: 'card-mountpoint',
    });

    // they store cards and modals
    this.cardList = [];
    this.modalList = [];

    this.addButton = this.newElement('button', 'add a thing!', {
      class: 'options-add-btn',
      click: this.newCardModal.bind(this),
    });
    this.modifyButton = this.newElement('button', 'modify button', {
      class: 'options-modify-btn',
      click: this.modifyModal.bind(this),
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
    if (automount === true) this.cardMountpoint.appendChild(element);
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

    // specified a parent -> append
    if (propertiesObj.hasOwnProperty('parentElement'))
      this.appendElement(false, propertiesObj.parentElement, element);

    // specified an event listener -> add it
    if (propertiesObj.hasOwnProperty('click'))
      element.addEventListener('click', propertiesObj['click']);

    return element;
  }

  newCard(word, example, definition, automount, parent) {
    const card = this.newElement('button', null, {
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

    // defintion not appended at first
    const definitionElement = this.newElement('p', definition, {
      class: 'card-definition',
    });

    this.appendElement(automount, parent, card);

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

  refreshCards(mountpoint = this.cardMountpoint) {
    // card mountpoint is always this.cardMountpoint

    // remove items from the mountpoint
    mountpoint.innerHTML = '';

    // add them from the list
    this.cardList.forEach(item => {
      this.appendElement(false, mountpoint, item);
    });
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
      this.toggleDisableAndBlur();

      // append this.settings
      document.body.appendChild(this.settings);
    } else {
      // remove settings
      document.body.removeChild(this.settings);

      // remove blur and enable elements back
      this.toggleDisableAndBlur();
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
    this.toggleDisableAndBlur();

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

    const btnCancel = this.generateRemoveButton(modal, modalContent);
  }

  modifyModal() {
    // element to which things are appended
    const modalContent = this.newElement('div', '', {});

    const modal = this.newModal(modalContent, false, document.body);
    this.toggleDisableAndBlur();

    // show all the cards in a row
    const previewCardList = this.cardList.map((item, i) => {
      const elementCopy = item.cloneNode(true);

      elementCopy.classList.add('small');

      // all of these cards should have an X in the top right corner, clicking on which deletes the card from the list
      const removeCardButton = this.newElement('button', null, {
        class: 'btn-delete',
        parentElement: elementCopy,
        click: () => {
          // remove from this.cardList
          this.cardList.splice(i, 1);
          console.log(this.cardList);

          // remove preview
          elementCopy.remove();

          // refresh cards - function that removes all the items and adds the ones from the list
          this.refreshCards();
        },
      });

      return elementCopy;
    });

    console.log(previewCardList);

    const previewCardContainer = this.newElement('div', [...previewCardList], {
      class: 'preview-card-container',
      parentElement: modalContent,
    });

    // TODO clicking on a card should bring up text inputs that control its content

    const btnCancel = this.generateRemoveButton(modal, modalContent);
  }

  generateRemoveButton(element, parent) {
    return this.newElement('button', 'cancel', {
      parentElement: parent,
      class: 'btn-cancel',
      click: () => {
        this.toggleDisableAndBlur();
        element.remove();
      },
    });
  }

  toggleDisableAndBlur() {
    this.toggleDisabledOnChildren('.main-element');
    this.mainElement.classList.toggle('blurred');
  }
}

const maker = new DomMaker();

const card1 = maker.newCard(
  'word',
  'this is an example sentence',
  'this is the definition of the word',
  true
);

const card2 = maker.newCard(
  'woord',
  'thiis is an example sentence',
  'this is the deffinition of the word',
  true
);

const card3 = maker.newCard(
  'wooord',
  'thiiis is an example sentence',
  'this is the defffinition of the word',
  true
);

// TODO
// settings
// side pane - modify
// toggle method for toggling blur and disabling

// changes
// fixed the bug with the cards misaligning
// changed the position of the delete button
// cards are now not clickable when modal is opened
// cards are now keyboard friendly
