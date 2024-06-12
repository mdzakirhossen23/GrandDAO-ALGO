import styles from "./Card.module.css";

const Card = ({ children, height, width }: any) => {
  return (
    <div
      className={`theme-moon-light flex flex-col items-center gap-2 py-6 px-8 border rounded-moon-s-lg bg-gohan text-bulma shrink-0 ${styles.card}`}
      style={{ height, width }}
    >
      {children}
    </div>
  );
};

export default Card;
