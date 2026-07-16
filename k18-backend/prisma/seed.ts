import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Make the seed re-runnable: clear product-related rows first (respecting
  // FK order) so re-seeding doesn't collide with the unique `slug`.
  await prisma.orderItem.deleteMany();
  await prisma.color.deleteMany();
  await prisma.product.deleteMany();

  // Product imagery uses absolute image URLs (same hosted-image approach as
  // the rest of the storefront). The previous "/images/shirt-1.jpg" paths
  // were relative to the frontend origin but no such files exist in
  // k18-frontend/public/images, so every product image 404'd.
  const shirtMain = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=1000&fit=crop";
  const shirtAlt = "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&h=1000&fit=crop";
  const coatMain = "https://images.unsplash.com/photo-1544923246-77307dd270b1?w=800&h=1000&fit=crop";
  const coatAlt = "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=1000&fit=crop";
  const shirtImages = [shirtMain, shirtAlt];
  const coatImages = [coatMain, coatAlt];

  const shirt = await prisma.product.create({
    data: {
      name: "Oxford Button-Down Shirt",
      slug: "oxford-button-down-shirt",
      category: "Tops",
      price: 89,
      description: "A timeless oxford shirt cut for a modern, tailored fit.",
      details: ["100% cotton", "Machine wash cold", "Slim fit"],
      images: shirtImages,
      sizes: ["S", "M", "L", "XL"],
      inStock: true,
      tag: "Bestseller",
      isNew: false,
      colors: {
        create: [{ name: "White", hex: "#F5F5F0", images: [shirtMain] }]
      }
    }
  });

  const coat = await prisma.product.create({
    data: {
      name: "Wool Overcoat",
      slug: "wool-overcoat",
      category: "Outerwear",
      price: 320,
      description: "A structured wool overcoat built for cold city mornings.",
      details: ["80% wool, 20% polyester", "Dry clean only", "Regular fit"],
      images: coatImages,
      sizes: ["M", "L", "XL"],
      inStock: true,
      tag: "New",
      isNew: true,
      colors: {
        create: [{ name: "Charcoal", hex: "#4A4A4A", images: [coatMain] }]
      }
    }
  });

  console.log({ shirt, coat });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());