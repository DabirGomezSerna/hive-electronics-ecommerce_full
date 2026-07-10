import { useParams } from "react-router-dom";
import CategoryDetails from "../components/CategoryDetails/CategoryDetails";

export default function CategoryPage() {
  const { categoryId } = useParams();

  return <CategoryDetails categoryId={categoryId} />;
}
