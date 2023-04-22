import EventDispatcher from "../../@shared/event/event-dispatcher";
import CustomerChangeAddressEvent from "../event/customer-change-address.event";
import CustomerCreatedEvent from "../event/customer-created.event";
import EnviaConsoleLogHandler from "../event/handler/envia-console-log";
import EnviaConsoleLog1Handler from "../event/handler/envia-console-log-1.handler";
import EnviaConsoleLog2Handler from "../event/handler/envia-console-log-2.handler";
import Address from "../value-object/address";
import Customer from "./customer";

describe("Customer unit tests", () => {
  it("should throw error when id is empty", () => {
    expect(() => {
      let customer = new Customer("", "John");
    }).toThrowError("Id is required");
  });

  it("should throw error when name is empty", () => {
    expect(() => {
      let customer = new Customer("123", "");
    }).toThrowError("Name is required");
  });

  it("should change name", () => {
    // Arrange
    const customer = new Customer("123", "John");

    // Act
    customer.changeName("Jane");

    // Assert
    expect(customer.name).toBe("Jane");
  });

  it("should activate customer", () => {
    const customer = new Customer("1", "Customer 1");
    const address = new Address("Street 1", 123, "13330-250", "São Paulo");
    customer.Address = address;

    customer.activate();

    expect(customer.isActive()).toBe(true);
  });

  it("should throw error when address is undefined when you activate a customer", () => {
    expect(() => {
      const customer = new Customer("1", "Customer 1");
      customer.activate();
    }).toThrowError("Address is mandatory to activate a customer");
  });

  it("should deactivate customer", () => {
    const customer = new Customer("1", "Customer 1");

    customer.deactivate();

    expect(customer.isActive()).toBe(false);
  });

  it("should add reward points", () => {
    const customer = new Customer("1", "Customer 1");
    expect(customer.rewardPoints).toBe(0);

    customer.addRewardPoints(10);
    expect(customer.rewardPoints).toBe(10);

    customer.addRewardPoints(10);
    expect(customer.rewardPoints).toBe(20);
  });

  it("should send events when customer was created", () => {
    const handler1 = new EnviaConsoleLog1Handler();
    const handler2 = new EnviaConsoleLog2Handler();
    const dispacher = new EventDispatcher();
    const spyHandler1 = jest.spyOn(handler1, 'handle');
    const spyHandler2 = jest.spyOn(handler2, 'handle');

    dispacher.register(CustomerCreatedEvent.name, handler1);
    dispacher.register(CustomerCreatedEvent.name, handler2);

    new Customer("1", "Customer 1", dispacher);

    expect(spyHandler1).toHaveBeenCalled()
    expect(spyHandler2).toHaveBeenCalled()
  });

  it("should send events when customer change address", () => {
    const handler = new EnviaConsoleLogHandler();
    const dispacher = new EventDispatcher();
    const spyHandler = jest.spyOn(handler, 'handle');
    jest.useFakeTimers('modern').setSystemTime(new Date());

    dispacher.register(CustomerChangeAddressEvent.name, handler);

    const customer = new Customer("1", "Customer 1", dispacher);
    const address = new Address("street 1", 1, "123456", "City 1");
    customer.changeAddress(address);

    expect(spyHandler).toHaveBeenCalledWith({
      dataTimeOccurred: new Date(),
      eventData: {
        id: customer.id,
        name: customer.name,
        address
      }
    })
  });
});
