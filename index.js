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

    // when a modal is open, elements should all be disabled
    this.elementsDisabled = false; // the flag changes state, so first it will disable elements, then it will switch

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
      prepend: true, // it needs to be first in the dom
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

  appendElement(automount, parent, element, prepend = false) {
    // true -> append to the default element
    if (automount === true) this.cardMountpoint.appendChild(element);
    else if (
      typeof parent === 'object' &&
      typeof parent.appendChild === 'function' &&
      typeof element === 'object' &&
      typeof element.appendChild === 'function'
    )
      if (prepend) parent.prepend(element);
      else parent.appendChild(element);
  }

  newElement(elementType, content, propertiesObj) {
    if (typeof elementType !== 'string') {
      return false;
    }

    const element = document.createElement(elementType);

    // append content
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
          // could be an array
          //run the function for each key

          const keys = Object.keys(content);

          for (let i = 0; i < keys.length; i++)
            recursiveCheckAssignContent(content[keys[i]], layer + 1); // check inside the object (array)
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
        // it's a style object!

        const styleKeys = Object.keys(propertiesObj.style);

        for (let j = 0; j < styleKeys.length; j++) {
          element.style[styleKeys[j]] = propertiesObj.style[styleKeys[j]];
        }
      } else element.setAttribute(keys[i], propertiesObj[keys[i]]); //style.width etc
    }

    // specified a parent -> append
    if (propertiesObj.hasOwnProperty('parentElement'))
      this.appendElement(
        false,
        propertiesObj.parentElement,
        element,
        propertiesObj.prepend // ignore if not set, if set to true it will be inserted as the first child of its parent
      );

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

    card.isFlipped = false; // isFlipped to the definition side
    card.flip = () => {
      if (!card.isFlipped) {
        card.removeChild(wordElement);
        card.removeChild(exampleElement);

        card.appendChild(definitionElement);
      } else {
        card.removeChild(definitionElement);

        card.appendChild(wordElement);
        card.appendChild(exampleElement);
      }

      card.isFlipped = !card.isFlipped;
    };

    card.addEventListener('click', () => {
      card.flip();
    });

    // state of the card should match the disabled
    card.disabled = this.elementsDisabled;

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

  toggleDisabled() {
    const childrenArray = document.querySelectorAll('.main-element *');

    this.elementsDisabled = !this.elementsDisabled;

    for (let i = 0; i < childrenArray.length; i++) {
      childrenArray[i].disabled = this.elementsDisabled; // first it will disable stuff then enable and so on
    }
  }

  generateLabels(parentElement) {
    const createLabel = labelText => {
      const textField = this.newElement('input', '', {
        type: 'text',
        class: 'card-input',
      });

      const labelTextElement = this.newElement('span', labelText, {
        class: 'label-text',
      });

      const labelElement = [
        this.newElement('label', [labelTextElement, textField], {
          parentElement: parentElement,
        }),
      ];

      return textField;
    };

    // three text input fields, a button to submit the input and a button to close the modal
    return [
      createLabel('word:'),
      createLabel('example:'),
      createLabel('definition:'),
    ];
  }

  newCardModal() {
    const modalContent = this.newElement('div', '', {});

    const modal = this.newModal(modalContent, false, document.body);
    this.toggleDisableAndBlur();

    const [wordInput, exampleInput, definitionInput] =
      this.generateLabels(modalContent);

    const btnSubmit = this.generateSubmitButton(
      true,
      wordInput,
      exampleInput,
      definitionInput,
      modalContent
    );

    const btnCancel = this.generateRemoveButton(modal, modalContent);
  }

  modifyModal() {
    // element to which things are appended
    const modalContent = this.newElement('div', '', {});

    const modal = this.newModal(modalContent, false, document.body);
    this.toggleDisableAndBlur();

    // create an array of the cards with additional functionalities
    const previewCardList = this.cardList.map(item => {
      // flip each card to the front side
      item.isFlipped ? item.flip() : '';

      const elementCopy = item.cloneNode(true); // true for deep copy

      elementCopy.classList.add('small');

      // all of these cards should have an X in the top right corner, clicking on which deletes the card from the list
      const removeCardButton = this.newElement('button', null, {
        class: 'btn-delete',
        parentElement: elementCopy,
        click: () => {
          // remove from cardlist
          this.cardList.includes(item)
            ? this.cardList.splice(this.cardList.indexOf(item), 1)
            : ''; // we need to find an index, the i variable is no longer correct when we modified the cardList structure

          // remove preview
          elementCopy.remove();

          // refresh cards is a function that removes all the items and adds the ones from the list
          this.refreshCards(this.cardMountpoint);
        },
      });

      // TODO clicking on a card should bring up text inputs that control its content
      elementCopy.addEventListener('click', () => {
        textInputsContainer.innerHTML = '';

        const [word, example, definition] =
          this.generateLabels(textInputsContainer);

        // TODO - redo the array that holds the cards, it should hold the items with their respective data (and IDs!)
        word.value = 'FIXME';
        example.value = 'FIXME';
        definition.value = 'FIXME';

        const submitButton = this.generateSubmitButton(
          false,
          word, // 'FIXME'
          example, // 'FIXME'
          definition, // 'FIXME'
          textInputsContainer
        );
      });

      // cards are copied, but the disabled property should stay false
      elementCopy.disabled = false;

      return elementCopy;
    });

    // append all of those items here
    const previewCardContainer = this.newElement('div', previewCardList, {
      class: 'preview-card-container',
      parentElement: modalContent,
      prepend: true,
    });

    const textInputsContainer = this.newElement('div', '', {
      parentElement: modalContent,
    });

    const btnCancel = this.generateRemoveButton(modal, modalContent);
  }

  updateCard(card, word, example, definition) {
    // TODO this function will be used to change values of cards
  }

  generateSubmitButton(
    makeNew,
    wordInput,
    exampleInput,
    definitionInput,
    parent,
    card = null
  ) {
    return this.newElement('button', 'submit', {
      class: 'btn-submit',
      parentElement: parent,
      click: () => {
        makeNew
          ? this.newCard(
              wordInput.value,
              exampleInput.value,
              definitionInput.value,
              true
            )
          : this.modifyCard(card, wordInput, exampleInput, definitionInput);
      },
    });
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
    this.toggleDisabled();
    this.mainElement.classList.toggle('blurred');
  }
}

const maker = new DomMaker();

function generateExampleCards(numberOfCards) {
  for (let i = 0; i < numberOfCards; i++) {
    maker.newCard(
      `word no.${i + 1}`,
      `example sentence no.${i + 1}`,
      `definition no.${i + 1}`,
      true
    );
  }
}

generateExampleCards(Math.floor(Math.random() * 5) + 1); // 1 to 5 cards

// TODO
// add:
//  options for settings
//  proper modify card options, changing text, switching the order of the cards, etc
//  decks of cards
//  duplicates and IDs
// refactor:
//  toggle method for toggling blur and disabling elements - unify the methods - they are different for settings and other modals
//  every modal begins with the same lines of code, remake it so there is a function that uses callbacks
