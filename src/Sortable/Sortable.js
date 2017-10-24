import Draggable from './../Draggable';

import {
  SortableStartEvent,
  SortableSortedEvent,
  SortableStopEvent,
} from './SortableEvent';

const onDragStart = Symbol('onDragStart');
const onDragOverContainer = Symbol('onDragOverContainer');
const onDragOver = Symbol('onDragOver');
const onDragStop = Symbol('onDragStop');

/**
 * Sortable is built on top of Draggable and allows sorting of draggable elements. Sortable will keep
 * track of the original index and emits the new index as you drag over draggable elements.
 * @class Sortable
 * @module Sortable
 * @extends Draggable
 */
export default class Sortable extends Draggable {

  /**
   * Sortable constructor.
   * @constructs Sortable
   * @param {HTMLElement[]|NodeList|HTMLElement} containers - Sortable containers
   * @param {Object} options - Options for Sortable
   */
  constructor(containers = [], options = {}) {
    super(containers, options);

    /**
     * start index of source on drag start
     * @property startIndex
     * @type {Number}
     */
    this.startIndex = null;

    /**
     * start container on drag start
     * @property startContainer
     * @type {HTMLElement}
     * @default null
     */
    this.startContainer = null;

    this[onDragStart] = this[onDragStart].bind(this);
    this[onDragOverContainer] = this[onDragOverContainer].bind(this);
    this[onDragOver] = this[onDragOver].bind(this);
    this[onDragStop] = this[onDragStop].bind(this);

    this
      .on('drag:start', this[onDragStart])
      .on('drag:over:container', this[onDragOverContainer])
      .on('drag:over', this[onDragOver])
      .on('drag:stop', this[onDragStop]);
  }

  /**
   * Destroys Sortable instance.
   */
  destroy() {
    super.destroy();

    this
      .off('drag:start', this[onDragStart])
      .off('drag:over:container', this[onDragOverContainer])
      .off('drag:over', this[onDragOver])
      .off('drag:stop', this[onDragStop]);
  }

  /**
   * Returns true index of element within its container during drag operation, i.e. excluding mirror and original source
   * @param {HTMLElement} element - An element
   * @return {Number}
   */
  index(element) {
    return [...element.parentNode.children].filter((childElement) => {
      return childElement !== this.originalSource && childElement !== this.mirror;
    }).indexOf(element);
  }

  /**
   * Drag start handler
   * @private
   * @param {DragStartEvent} event - Drag start event
   */
  [onDragStart](event) {
    this.startContainer = event.source.parentNode;
    this.startIndex = this.index(event.source);

    const sortableStartEvent = new SortableStartEvent({
      dragEvent: event,
      startIndex: this.startIndex,
      startContainer: this.startContainer,
    });

    this.trigger(sortableStartEvent);

    if (sortableStartEvent.canceled()) {
      event.cancel();
    }
  }

  /**
   * Drag over container handler
   * @private
   * @param {DragOverContainerEvent} event - Drag over container event
   */
  [onDragOverContainer](event) {
    if (event.canceled()) {
      return;
    }

    const {source, over, overContainer} = event;
    const oldIndex = this.index(source);

    const moves = move(source, over, overContainer);

    if (!moves) {
      return;
    }

    const {oldContainer, newContainer} = moves;
    const newIndex = this.index(event.source);

    const sortableSortedEvent = new SortableSortedEvent({
      dragEvent: event,
      oldIndex,
      newIndex,
      oldContainer,
      newContainer,
    });

    this.trigger(sortableSortedEvent);
  }

  /**
   * Drag over handler
   * @private
   * @param {DragOverEvent} event - Drag over event
   */
  [onDragOver](event) {
    if (event.over === event.originalSource || event.over === event.source) {
      return;
    }

    const {source, over, overContainer} = event;
    const oldIndex = this.index(source);

    const moves = move(source, over, overContainer);

    if (!moves) {
      return;
    }

    const {oldContainer, newContainer} = moves;
    const newIndex = this.index(source);

    const sortableSortedEvent = new SortableSortedEvent({
      dragEvent: event,
      oldIndex,
      newIndex,
      oldContainer,
      newContainer,
    });

    this.trigger(sortableSortedEvent);
  }

  /**
   * Drag stop handler
   * @private
   * @param {DragStopEvent} event - Drag stop event
   */
  [onDragStop](event) {
    const sortableStopEvent = new SortableStopEvent({
      dragEvent: event,
      oldIndex: this.startIndex,
      newIndex: this.index(event.source),
      oldContainer: this.startContainer,
      newContainer: event.source.parentNode,
    });

    this.trigger(sortableStopEvent);

    this.startIndex = null;
    this.startContainer = null;
  }
}

function index(element) {
  return Array.prototype.indexOf.call(element.parentNode.children, element);
}

function move(source, over, overContainer) {
  const emptyOverContainer = !overContainer.children.length;
  const differentContainer = over && (source.parentNode !== over.parentNode);
  const sameContainer = over && (source.parentNode === over.parentNode);

  if (emptyOverContainer) {
    return moveInsideEmptyContainer(source, overContainer);
  } else if (sameContainer) {
    return moveWithinContainer(source, over);
  } else if (differentContainer) {
    return moveOutsideContainer(source, over);
  } else {
    return null;
  }
}

function moveInsideEmptyContainer(source, overContainer) {
  const oldContainer = source.parentNode;

  overContainer.appendChild(source);

  return {oldContainer, newContainer: overContainer};
}

function moveWithinContainer(source, over) {
  const oldIndex = index(source);
  const newIndex = index(over);

  if (oldIndex < newIndex) {
    source.parentNode.insertBefore(source, over.nextElementSibling);
  } else {
    source.parentNode.insertBefore(source, over);
  }

  return {oldContainer: source.parentNode, newContainer: source.parentNode};
}

function moveOutsideContainer(source, over) {
  const oldContainer = source.parentNode;

  over.parentNode.insertBefore(source, over);

  return {oldContainer, newContainer: source.parentNode};
}
