import React, {Component} from 'react';
import {Col, Container, Badge, Row, Jumbotron, ListGroup, ListGroupItem, Progress, Button} from "reactstrap";
import axios from 'axios'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: this.props.suivis,
            ids: this.props.ids,
            isEnd: false
        };
        this.openFile = this.openFile.bind(this);
    }

    componentDidMount() {
        const interval = setInterval(function () {
            axios.post(`http://217.108.211.171:8082/ged/suivi`, {
                ids: this.state.ids
            }).then(response => {
                console.log(response.data);

                this.setState({
                    data: response.data
                }, () => {
                    if (response.data[0].requestEnd !== "") {
                        this.setState({
                            isEnd: true
                        });
                        clearInterval(interval);
                        axios.post(`http://217.108.211.171:8082ged/removesuivi`, {
                            ids: this.state.ids
                        });
                    }
                });
            });
        }.bind(this), 1500);
    }

    openFile(fileName) {
        const win = window.open(`http://217.108.211.171:8082/ged/file/${fileName}`, '_blank');
        win.focus();
    }

    render() {
        return (
            <div className="app flex-row align-items-center">
                <Container>
                    <ReactCSSTransitionGroup transitionName="example" transitionEnterTimeout={700}
                                             transitionLeaveTimeout={700}>
                        {this.state.isEnd ?
                            <Row className="justify-content-center">
                                <Button color="primary" size="lg" block onClick={() => this.openFile(this.state.data[0].requestEnd)}>Tous les fichiers</Button>
                            </Row> : null}

                    </ReactCSSTransitionGroup>
                    {this.state.data.map((suivi, index) =>
                        <Jumbotron key={index}>
                            <Row className="justify-content-center">
                                <Col md="6">
                                    <h1><Badge color="info">{suivi.numeroEquinoxe}</Badge></h1>
                                    <h6>{suivi.statut !== "ERROR" ?
                                        <Badge color="success">{suivi.statut}</Badge> :
                                        <Badge color="danger">{suivi.statut}</Badge>}</h6>
                                    <ReactCSSTransitionGroup transitionName="example" transitionEnterTimeout={700}
                                                             transitionLeaveTimeout={700}>
                                        {suivi.progress === 100 ?
                                            <Button color="primary" size="lg"
                                                    onClick={() => this.openFile(suivi.fileName)}>Voir le
                                                fichier</Button> : ""}
                                    </ReactCSSTransitionGroup>
                                </Col>

                                <Col md="4">
                                    <ListGroup>
                                        <ReactCSSTransitionGroup transitionName="example" transitionEnterTimeout={700}
                                                                 transitionLeaveTimeout={700}>
                                            {suivi.files.map((file, index) => {
                                                return <ListGroupItem key={index} className="todo-item">
                                                    {file.fileName}
                                                    <Progress
                                                        value={suivi.progress}>{suivi.progress}%</Progress>
                                                </ListGroupItem>
                                            })}
                                        </ReactCSSTransitionGroup>
                                    </ListGroup>
                                </Col>
                            </Row>
                        </Jumbotron>
                    )}
                </Container>
            </div>
        );
    }
}
