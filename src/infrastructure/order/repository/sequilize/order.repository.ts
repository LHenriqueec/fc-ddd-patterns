import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total,
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderModel.update(
      {
        id: entity.id,
        customer_id: entity.customerId
      },
      {
        where: { id: entity.id }
      })
      .then(() => entity.items.forEach(item => {
          OrderItemModel.upsert({
            order_id: entity.id,
            id: item.id,
            name: item.name,
            price: item.price,
            product_id: item.productId,
            quantity: item.quantity,
          })
        })
      )
  }

  async find(id: string): Promise<Order> {
    return OrderModel.findOne({
      where: { id },
      include: ["items"]
    }).then(this.transformModel)
  }

  async findAll(): Promise<Order[]> {
    return OrderModel.findAll({
      include: ["items"]
    })
    .then(models => models.map(this.transformModel))
  }

  private transformModel(model: OrderModel): Order {
    const items = model.items.map(itemModel => new OrderItem(
      itemModel.id,
      itemModel.name,
      itemModel.price,
      itemModel.product_id,
      itemModel.quantity
    ));
    return new Order(model.id, model.customer_id, items);
  }
}
