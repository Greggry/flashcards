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
    this.cardArray = [];
    this.modalArray = [];

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
      } else
        element.setAttribute(
          keys[i].replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()),
          propertiesObj[keys[i]]
        ); // parse to give attributes converted to kebab-case (dataId -> data-id)
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

  newCard(word, example, definition, options) {
    const id = options.id // if we set an id before (rerender)
      ? options.id
      : `${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const card = this.newElement('button', null, {
      class: 'card',
      dataId: id,
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

    if (options.mount || options.parentElement)
      this.appendElement(options.mount, options.parentElement, card);

    // flippable unless specified otherwise
    if (!(options.isFlippable === false)) {
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
    }

    if (!options.rerender)
      // the card is loaded for the first time
      this.cardArray.push({
        id,
        word,
        example,
        definition,
      });

    // state of the card should match the disabled
    card.disabled = this.elementsDisabled;

    return card;
  }

  refreshCards(mountpoint = this.cardMountpoint) {
    // card mountpoint is always this.cardMountpoint

    // remove items from the mountpoint
    mountpoint.innerHTML = '';

    // add them from the list
    this.cardArray.forEach(item => {
      this.newCard(item.word, item.example, item.definition, {
        mount: true,
        rerender: true,
      });
    });
  }

  newModal(contents, automount, parent) {
    const modal = this.newElement('div', contents, {
      class: 'modal-window',
    });

    this.appendElement(automount, parent, modal);

    this.modalArray.push(modal);

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

  generateCardPreview() {
    const previewCardArray = [];

    // forEach card make a new one
    this.cardArray.forEach(cardObject => {
      const cardElement = this.newCard(
        cardObject.word,
        cardObject.example,
        cardObject.definition,
        { isFlippable: false, mount: false, rerender: true, id: cardObject.id }
      );

      cardElement.classList.add('small');
      cardElement.disabled = false;

      // push the element to previewcardarray
      previewCardArray.push(cardElement);

      const removeCardButton = this.newElement('button', null, {
        class: 'btn-delete',
        parentElement: cardElement,
        click: () => {
          // remove from cardArray
          this.cardArray.includes(cardObject)
            ? this.cardArray.splice(this.cardArray.indexOf(cardObject), 1)
            : '';

          // remove preview
          cardElement.remove();

          this.refreshCards(this.cardMountpoint);
        },
      });
    });

    return previewCardArray;
  }

  modifyModal() {
    // the element to which things are appended
    const modalContent = this.newElement('div', '', {});

    const modal = this.newModal(modalContent, false, document.body);
    this.toggleDisableAndBlur();

    // create an array of the cards with additional functionalities
    const previewCardArray = this.generateCardPreview();

    // prepend all of those items here
    this.previewCardContainer = this.newElement('div', previewCardArray, {
      class: 'preview-card-container',
      parentElement: modalContent,
      prepend: true,
    });

    const textInputsContainer = this.newElement('div', '', {
      parentElement: modalContent,
    });

    // event delegation
    this.previewCardContainer.addEventListener('click', event => {
      textInputsContainer.innerHTML = '';

      const [word, example, definition] =
        this.generateLabels(textInputsContainer);

      // get the IDs from the DOM, then get the cardObject
      const clicked = event.target.closest('.card');

      const cardObject = this.cardArray.find(
        card => card.id === clicked?.dataset.id
      );
      if (clicked) {
        word.value = cardObject.word;
        example.value = cardObject.example;
        definition.value = cardObject.definition;
      }

      const submitButton = this.generateSubmitButton(
        false,
        word,
        example,
        definition,
        textInputsContainer,
        cardObject
      );
    });

    const btnCancel = this.generateRemoveButton(modal, modalContent);
  }

  updateCard(card, word, example, definition) {
    // TODO this function will be used to change values of cards

    if (!card) return;

    card.word = word;
    card.example = example;
    card.definition = definition;

    // update UI
    this.refreshCards();

    this.previewCardContainer.innerHTML = '';
    this.generateCardPreview().forEach(card =>
      this.previewCardContainer.append(card)
    );
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
              { mount: true }
            )
          : this.updateCard(
              card,
              wordInput.value,
              exampleInput.value,
              definitionInput.value
            );
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
      { mount: true }
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
