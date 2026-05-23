import "./StatCard.css";

const StatCard = ({ title, value, subtitle, icon }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div>
          <span className="stat-title">{title}</span>
          <h2 className="stat-value">{value}</h2>
        </div>

        <div className="stat-icon-wrapper">
          <span className="stat-icon">{icon}</span>
        </div>
      </div>

      <p className="stat-subtitle">{subtitle}</p>
    </div>
  );
};

export default StatCard;