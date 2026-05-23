const DashboardActivityCard = ({ title, items = [], renderItem, emptyMessage }) => {
  return (
    <div className="content-card dashboard-activity-card">
      <h2>{title}</h2>

      {items.length === 0 ? (
        <p className="activity-empty">{emptyMessage || "No recent activity found."}</p>
      ) : (
        <div className="activity-list">
          {items.map((item, index) => (
            <div className="activity-item" key={item.id || index}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardActivityCard;