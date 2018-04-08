// eslint-disable-next-line import/no-unresolved
import {Swappable} from '@shopify/draggable';

export default function Floated() {
  const containers = document.querySelectorAll('#Floated .BlockLayout');

  if (containers.length === 0) {
    return false;
  }

  const swappable = new Swappable(containers, {
    draggable: '.Block--isDraggable',
    mirror: {
      constrainDimensions: true,
    },
  });

  return swappable;
}
