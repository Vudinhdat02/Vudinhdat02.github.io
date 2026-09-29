import { motion, useReducedMotion } from 'framer-motion';

/**
 * Scroll-reveal wrapper. Content is visible at rest for reduced-motion users.
 * effect: 'up' | 'down' | 'left' | 'right' | 'zoom' | 'blur' | 'flip' | 'wipe'
 */
const EFFECTS = {
  up:    { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } },
  down:  { hidden: { opacity: 0, y: -30 }, show: { opacity: 1, y: 0 } },
  left:  { hidden: { opacity: 0, x: -70, skewX: 4 }, show: { opacity: 1, x: 0, skewX: 0 } },
  right: { hidden: { opacity: 0, x: 70, skewX: -4 }, show: { opacity: 1, x: 0, skewX: 0 } },
  zoom:  { hidden: { opacity: 0, scale: 0.86 }, show: { opacity: 1, scale: 1 } },
  blur:  { hidden: { opacity: 0, y: 16, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1 } },
  flip:  { hidden: { opacity: 0, rotateX: -55, y: 30, transformPerspective: 900 }, show: { opacity: 1, rotateX: 0, y: 0, transformPerspective: 900 } },
  wipe:  { hidden: { opacity: 0, clipPath: 'inset(0 100% 0 0)' }, show: { opacity: 1, clipPath: 'inset(0 0% 0 0)' } },
  wipeLeft: { hidden: { opacity: 0, clipPath: 'inset(0 0 0 100%)' }, show: { opacity: 1, clipPath: 'inset(0 0 0 0%)' } },
};

export default function Reveal({ as = 'div', effect = 'up', delay = 0, duration = 0.7, once = true, amount = 0.2, className, children, ...rest }) {
  const reduced = useReducedMotion();
  const Comp = motion[as] || motion.div;
  const v = EFFECTS[effect] || EFFECTS.up;
  if (reduced) return <Comp className={className} {...rest}>{children}</Comp>;
  const transition = { duration, delay, ease: [0.22, 1, 0.36, 1] };
  // Clip-path effects hide the element's area, and a hidden area never counts as "in view".
  // So the outer element watches the viewport and an inner layer does the clipping.
  if (effect === 'wipe' || effect === 'wipeLeft') {
    return (
      <Comp className={className} initial="hidden" whileInView="show" viewport={{ once, amount: 0.1 }} variants={{ hidden: {}, show: {} }} {...rest}>
        <motion.div className="reveal-clip" variants={v} transition={transition}>{children}</motion.div>
      </Comp>
    );
  }
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={v}
      transition={transition}
      {...rest}
    >
      {children}
    </Comp>
  );
}
