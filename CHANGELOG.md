# Changelog

## 0.1.3 - 2021-06-24

<hr />

### Added:

- the titles to modals
- BEM naming convention (css)

### Changed:

- reorganised the code
- combined functions together (the ones that were called once / after each other)
- reorganised functions' arguments (flags now are passed additional options)
- changed variables to be more descriptive (example: isEnabled for booleans)
- iterable.forEach() instead of for loops
- unified the way modals are shown

## 0.1.2 - 2021-06-21

<hr />

### Added:

- the functionality to change flashcard contents
- the function to reload the preview cards in the modal window
- the option to make cards unflippable (for previews)

### Changed:

- the organisation of cards. They are now stored as objects.
- DomMaker.newElement() now converts the attributes to kebab-case

## 0.1.1 - 2021-05-30

<hr />

### Added:

- 'modify' modal: only front sides of flashcards are shown
- the prepend functionality (prepend: true in attributesObject)
- grid display
- a random number of cards is generated each refresh (1-5 cards)
- now the method for flipping cards is stored in card.flip

### Changed:

- toggleDisabled (previously toggleDisabledOnChildren) now consequently changes the disabled property to one state on the other for all children of .main-element
- fixed card removal and display system (in the 'modify' modal)
- side-pane is not position: absolute now, but a grid element
- removed the opacity from modal windows

## 0.1.0 - 2021-05-28

<hr/>

### Added:

- the changelog into the project

### Changed:

- set the right project's version (to 0.1.0)
- fixed the bug with the cards misaligning when clicked
- changed the position of the delete button on
- cards are now not clickable when modal is opened
- cards are now keyboard friendly & focusable (they are now button elements)
