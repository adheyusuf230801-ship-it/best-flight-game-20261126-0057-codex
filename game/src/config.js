// World distances are pixels; time is seconds; positive Y points down.
export const VIEW = Object.freeze({ w: 1280, h: 800 });

export const TUNING = Object.freeze({
  gravity: 82,
  liftK: 0.0062,
  dragK: 0.00105,
  thrustMax: 100,
  stallSpeed: 78,
  maxSpeed: 340,
  fuelStart: 100,
  fuelBurn: 0.48,
  damageHard: 24,
  ringBonus: 150,
  landBonus: 500,
  sortieTime: 180,
});

export const TERRAIN = Object.freeze({ valleyLength: 16000, ridgeAmp: 100 });

export const MISSIONS = Object.freeze([
  Object.freeze({
    id: 'rings',
    name: 'The Ridgeline Run',
    brief: 'Fly through all six glowing rings in order, then land at the marked airstrip to deliver the mail.',
  }),
  Object.freeze({
    id: 'delivery',
    name: 'Special Delivery',
    brief: 'Carry the valley mail to the marked airstrip. Ease off the throttle and touch down gently.',
  }),
  Object.freeze({
    id: 'rescue',
    name: 'One More Passenger',
    brief: 'Land near the hiker’s flag, pick them up, then take off and bring them safely to the marked airstrip.',
  }),
]);
