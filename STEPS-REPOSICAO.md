# STEPS-REPOSICAO

Here was specified the flow of reposition on the Seufisio App.

## Prerequisites

1. Authentication (STEPS-GERAL.md)

## Flow

1. Create a API to search a customer by name using `./clients.md`.
2. Create a API to get return the quantity of repositions the customer has, using the API `./lista-vendas` and count the `atendimentosRepor` field.
3. Create a API to create a new reposition, to do that:
    1. Receive the date and hour requested, and the customerId.
    2. Use the API `./list-profissionais` to get the list of professionals.
    3. Use the API `./lista-basic-atendimentos` by each professional to get the available slots (by a max attendaces per hour, define a env variable with default value 4).
    4. Check if the requested date and hour is available for any professional.
    5. The profissional_id needs to be the same that the selected slot.
    6. If available, create the reposition using the API `./create-atendimento-reposicao`.
    7. If not available, return an error message.
