import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outlined' | 'black' | 'dark-outlined' | 'green-inverted' | 'outlined-on-dark' | 'frap';
  size?: 'default' | 'large' | 'frap-mini';
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'default', 
  children, 
  icon,
  className = '', 
  ...props 
}) => {
  const baseClass = `${styles.btn} ${styles[variant]} ${styles[`size-${size}`]} ${className}`;
  
  return (
    <button className={baseClass.trim()} {...props}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
};
