import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customer = await createCustomer("123");
    const product = await createProduct("123");
    const orderItem = await createOrderItem("1", product, 2);

    const order = new Order("123", customer.id, [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total,
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("should find order by id", async () => {
    let customer = await createCustomer("123");
    let product = await createProduct("123");
    let orderItem = await createOrderItem("1", product, 2);
    const order = new Order("123", customer.id, [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderFound = await orderRepository.find(order.id);
    
    expect(orderFound).toStrictEqual(order);
  });

  it("should update an order", async () => {
    let customer = await createCustomer("123");
    const product = await createProduct("123");
    const orderItem1 = await createOrderItem("1", product, 2);
    const order = new Order("123", customer.id, [orderItem1]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const product2 = await createProduct("456");
    const orderItem2 = await createOrderItem("2", product2, 1);
    order.addItem(orderItem2);

    await orderRepository.update(order);
    const orderUpdated = await orderRepository.find(order.id);

    expect(orderUpdated).toStrictEqual(order);
  });

  it("should list all orders", async () => {
    let customer = await createCustomer("123");
    let product = await createProduct("123");
    let orderItem = await createOrderItem("1", product, 2);
    const order = new Order("123", customer.id, [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    let orders = await orderRepository.findAll();

    expect(orders).toStrictEqual([order]);

    customer = await createCustomer("456");
    orderItem = await createOrderItem("2", product, 1);
    const order2 = new Order("456", customer.id, [orderItem]);
    await orderRepository.create(order2);

    orders = await orderRepository.findAll();

    expect(orders).toStrictEqual([order, order2]);
  })

  async function createCustomer(id: string, name: string = "Customer"): Promise<Customer> {
    const customerRepository = new CustomerRepository();
    const customer = new Customer(id, name);
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);
    return customer;
  }

  async function createProduct(id: string, name: string = "Product", price: number = 10): Promise<Product> {
    const productRepository = new ProductRepository();
    const product = new Product(id, name, price);
    await productRepository.create(product);
    return product;
  }

  async function createOrderItem(id: string, product: Product, quantity: number = 1): Promise<OrderItem> {
    return new OrderItem(
      id,
      product.name,
      product.price,
      product.id,
      quantity
    );
  }
});
