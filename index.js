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

    // this flag tracks the state of the children of main element
    this.isEachChildDisabled = false; // the flag changes state, so first it will disable elements, then it will switch

    // they store cards and modals
    this.cardArray = [];

    // generate buttons for options
    this.addButton = this.newElement('button', 'new', {
      class: 'options-add-btn',
      click: this.newCardModal.bind(this),
    });
    this.modifyButton = this.newElement('button', 'modify', {
      class: 'options-modify-btn',
      click: this.modifyModal.bind(this),
    });
    this.settingsButton = this.newElement('button', 'settings', {
      class: 'options-settings-btn',
      click: this.settingsModal.bind(this),
    });

    this.options = this.newElement(
      'div',
      [this.addButton, this.modifyButton, this.settingsButton],
      {}
    );

    this.sidePane = this.newElement('div', ['<h1>options</h1>', this.options], {
      class: 'side-pane',
      parentElement: this.mainElement,
      doPrepend: true, // it needs to be first in the dom
    });
  }

  appendElement(doMount, parent, element, doPrepend = false) {
    // true -> append to the default element
    if (doMount === true) this.cardMountpoint.appendChild(element);
    else if (
      typeof parent === 'object' &&
      typeof parent.appendChild === 'function' &&
      typeof element === 'object' &&
      typeof element.appendChild === 'function'
    )
      if (doPrepend) parent.prepend(element);
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
      if (layer >= maxLayer || !content) return;

      if (typeof content === 'string')
        // valid argument for innerHTML
        element.innerHTML = content;
      else if (typeof content === 'object' && typeof content.appendChild === 'function')
        // valid DOM node inside
        element.appendChild(content);
      else if (typeof content === 'object') {
        // array is an object too, this case works for them both

        const keys = Object.keys(content);

        // run the function for each key
        keys.forEach(key => recursiveCheckAssignContent(content[key], layer + 1)); // check inside the object (array)
      }
    })(content, 0, 3);

    if (!propertiesObj) {
      return element; // we're done
    }

    // adding properties
    const keys = Object.keys(propertiesObj); // list of property names

    keys.forEach(key => {
      if (typeof propertiesObj[key] !== 'string' && key !== 'style') return; // same as 'continue' in a for loop

      // check to assign styles
      if (key === 'style') {
        const styleKeys = Object.keys(propertiesObj.style);

        styleKeys.map(styleProperty => {
          element.style[styleProperty] = propertiesObj.style[styleProperty];
        });
      } else
        element.setAttribute(
          key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()),
          propertiesObj[key]
        ); // parse to give attributes converted to kebab-case (dataId -> data-id)
    });

    // specified a parent -> append
    if (propertiesObj.hasOwnProperty('parentElement'))
      this.appendElement(
        false,
        propertiesObj.parentElement,
        element,
        propertiesObj.doPrepend // ignore if not set, if set to true it will be inserted as the first child of its parent
      );

    // specified an event listener -> add it
    if (propertiesObj.hasOwnProperty('click'))
      element.addEventListener('click', propertiesObj['click']);

    return element;
  }

  newCard(word, example, definition, options) {
    const id = options.id // if we set an id before (doRerender)
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

    if (options.doMount || options.parentElement)
      this.appendElement(options.doMount, options.parentElement, card);

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

    if (!options.doRerender)
      // the card is loaded for the first time
      this.cardArray.push({
        id,
        word,
        example,
        definition,
      });

    // state of the card should match the disabled
    card.disabled = this.isEachChildDisabled;

    return card;
  }

  refreshCards(mountpoint = this.cardMountpoint) {
    // card mountpoint is always this.cardMountpoint

    // remove items from the mountpoint
    mountpoint.innerHTML = '';

    // add them from the list
    this.cardArray.forEach(item => {
      this.newCard(item.word, item.example, item.definition, {
        doMount: true,
        doRerender: true,
      });
    });
  }

  newModal(doMount, parent) {
    // the element to which things are appended
    const modalContent = this.newElement('div', '', {
      class: 'modal-content',
    });
    const modal = this.newElement('div', modalContent, {
      class: 'modal-window',
    });

    this.appendElement(doMount, parent, modal);
    this.toggleDisableAndBlur();

    const cancelButton = this.newElement('button', 'cancel', {
      parentElement: modal, // not modalContent, because we want it always at the bottom
      class: 'btn-cancel',
      click: () => {
        this.toggleDisableAndBlur();
        modal.remove();
      },
    });

    return modalContent;
  }

  toggleDisabled() {
    const childrenArray = document.querySelectorAll('.main-element *');

    this.isEachChildDisabled = !this.isEachChildDisabled;

    childrenArray.forEach(child => {
      child.disabled = this.isEachChildDisabled; // first it will disable the children then enable and so on
    });
  }

  generateForm(parentElement, options) {
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

      return [labelElement, textField];
    };

    const [wordLabel, wordInput] = createLabel('word:');
    const [exampleLabel, exampleInput] = createLabel('example:');
    const [definitionLabel, definitionInput] = createLabel('definition:');

    const formContainer = this.newElement('div', [wordLabel, exampleLabel, definitionLabel], {
      class: 'form-container',
    });

    const submitButton = this.newElement('button', 'submit', {
      class: 'btn-submit',
      parentElement: formContainer,
      click: () => {
        options.doMakeNew
          ? this.newCard(wordInput.value, exampleInput.value, definitionInput.value, {
              doMount: true,
            })
          : this.updateCard(
              options.card,
              wordInput.value,
              exampleInput.value,
              definitionInput.value
            );
      },
    });
    // three text input fields, a button to submit the input and a button to close the modal
    return [formContainer, wordInput, exampleInput, definitionInput];
  }

  newCardModal() {
    const modalContent = this.newModal(false, document.body);

    const [formContainer] = this.generateForm(modalContent, {
      doMakeNew: true,
    });

    modalContent.appendChild(formContainer);
  }

  generateCardPreview() {
    const previewCardArray = [];

    // forEach card make a new one
    this.cardArray.forEach(cardObject => {
      const cardElement = this.newCard(cardObject.word, cardObject.example, cardObject.definition, {
        isFlippable: false,
        doMount: false,
        doRerender: true,
        id: cardObject.id,
      });

      cardElement.classList.add('small');
      cardElement.disabled = false;

      // push the element to previewcardarray
      previewCardArray.push(cardElement);

      const removeCardButton = this.newElement('button', null, {
        class: 'btn-delete',
        parentElement: cardElement,
        click: e => {
          // remove from cardArray
          this.cardArray.includes(cardObject)
            ? this.cardArray.splice(this.cardArray.indexOf(cardObject), 1)
            : '';

          // if there are labels shown, remove them from the DOM
          cardElement.closest('.modal-content').querySelector('.form-container')?.remove();

          // remove preview card
          cardElement.remove();

          this.refreshCards(this.cardMountpoint);
        },
      });
    });

    return previewCardArray;
  }

  modifyModal() {
    const modalContent = this.newModal(false, document.body);
    // create an array of the cards with additional functionalities
    const previewCardArray = this.generateCardPreview();

    // prepend all of those items here - so they are at the top of the modal
    this.previewCardContainer = this.newElement('div', previewCardArray, {
      class: 'preview-card-container',
      parentElement: modalContent,
      doPrepend: true,
    });

    // event delegation
    this.previewCardContainer.addEventListener('click', event => {
      if (event.target.classList.contains('btn-delete')) return;

      modalContent.querySelectorAll('.form-container').forEach(elem => elem.remove());

      // get the IDs from the DOM, then get the cardObject
      const clicked = event.target.closest('.card');
      const cardObject = this.cardArray.find(card => card.id === clicked?.dataset.id);

      const [formContainer, wordInput, exampleInput, definitionInput] = this.generateForm(
        modalContent,
        {
          card: cardObject,
        }
      );
      this.previewCardContainer.after(formContainer);
      if (clicked) {
        wordInput.value = cardObject.word;
        exampleInput.value = cardObject.example;
        definitionInput.value = cardObject.definition;
      }
    });
  }

  settingsModal() {
    const modalContent = this.newModal(false, document.body);

    modalContent.innerHTML = 'Add stuff here later!';
  }

  updateCard(card, word, example, definition) {
    if (!card) return;

    card.word = word;
    card.example = example;
    card.definition = definition;

    // update UI
    this.refreshCards();

    this.previewCardContainer.innerHTML = '';
    this.generateCardPreview().forEach(card => this.previewCardContainer.append(card));
  }

  toggleDisableAndBlur() {
    this.toggleDisabled();
    this.mainElement.classList.toggle('blurred');
  }
}

const maker = new DomMaker();

function generateExampleCards(numberOfCards) {
  for (let i = 0; i < numberOfCards; i++) {
    maker.newCard(`word no.${i + 1}`, `example sentence no.${i + 1}`, `definition no.${i + 1}`, {
      doMount: true,
    });
  }
}

generateExampleCards(Math.floor(Math.random() * 5) + 1); // 1 to 5 cards

// TODO
// add:
//  the titles at the top for modals
//  options for settings (changing the colour of cards)
//  modify modal:
//    proper modify card options, switching the order of the cards (dragging?), and such
//    right side of labels: preview of the card that updates live as you type the options, with a checkbox/button to show the other side
// modify:
//  the functions' arguments:
//    make the options for arguments to which sometimes empty strings or nulls are passed, since they're almost optional
//    change the order so it is consistent
