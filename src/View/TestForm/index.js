import React, { Component } from 'react';
import {Col, Container, Row, Form, Label, Input, Button} from "reactstrap";


export default class App extends Component {
    render() {
        return (
            <div className="app flex-row align-items-center">
                <Container>
                    <Row className="justify-content-center">
                        <Col md="6">
                            <Form action="http://217.108.211.171:8082/ged" method="POST"  target="_blank">
                                <Label>
                                    Numdocs :
                                </Label>
                                    <Input type="text" value="" name="numdocs[]"/>
                                    <Input type="text" value="" name="numdocs[]"/>
                                    <Input type="text" value="" name="numdocs[]"/>
                                    <Input type="text" value="" name="numdocs[]"/>
                                <Button type="submit" value="Submit" color="warning">Submit</Button>
                            </Form>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }
}



