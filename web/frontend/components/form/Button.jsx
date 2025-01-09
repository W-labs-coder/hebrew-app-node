import React from "react";
import PropTypes from "prop-types";

const Button = ({
  children,
  onClick,
  className = "",
  variant = "primary",
  type = "button",
  disabled = false,
}) => {
  const baseStyle =
    "transition-colors duration-200";

  const variants = {
    primary: "bg-yellow hover:bg-blue-600",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-500 hover:bg-red-600",
  };

  const buttonClass = `${baseStyle} ${variants[variant]} ${className} ${
    disabled ? "opacity-50 cursor-not-allowed" : ""
  }`.trim();

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["primary", "secondary", "danger"]),
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  disabled: PropTypes.bool,
};

export default Button;
