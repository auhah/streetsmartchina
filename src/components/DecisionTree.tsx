import type {
  DecisionTree as DecisionTreeContent,
  DecisionTreeItem,
} from "@/content/content-loader";

type DecisionTreeProps = {
  tree: DecisionTreeContent | null;
};

type DecisionTreeListProps = {
  items: readonly DecisionTreeItem[];
};

function DecisionTreeList({ items }: DecisionTreeListProps) {
  return (
    <ol className="decision-tree__list">
      {items.map((item, index) => (
        <li className="decision-tree__item" key={`${item.question}-${index}`}>
          <div className="decision-tree__body">
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </div>
          {item.children.length > 0 ? (
            <DecisionTreeList items={item.children} />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function DecisionTree({ tree }: DecisionTreeProps) {
  if (!tree) {
    return null;
  }

  return (
    <section aria-labelledby="decision-tree-heading" className="guide-section">
      <h2 id="decision-tree-heading">{tree.title}</h2>
      <DecisionTreeList items={tree.items} />
    </section>
  );
}
