import React, { useEffect, useState } from 'react';
import { animate, useMotionValue, useTransform, motion } from 'framer-motion';

const AnimatedCounter = ({ value, duration = 1, prefix = '', suffix = '' }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    // Round to 2 decimal places if number, otherwise handle as integer
    const val = Number(latest);
    if (isNaN(val)) return 0;
    return val.toLocaleString(undefined, {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
  });

  useEffect(() => {
    const controls = animate(count, value, { duration: duration, ease: "easeOut" });
    return controls.stop;
  }, [value, duration]);

  return (
    <span>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
