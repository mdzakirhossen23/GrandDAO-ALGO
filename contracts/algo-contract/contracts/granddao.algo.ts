import { Contract } from '@algorandfoundation/tealscript';
type dao_uri_struct = {
  dao_wallet: string;
  dao_uri: string;
  finished: string;
}
type goal_uri_struct = {
  dao_id: uint64;
  goal_uri: string;
}
type ideas_uri_struct = {
  goal_id: uint64;
  ideas_uri: string;
  donation: uint64;
}
type donation_struct = {
  ideas_id: uint64;
  wallet: string;
  donation: uint64;
}
type goal_ideas_votes_struct = {
  goal_id: uint64;
  ideas_id: uint64;
  wallet: string;
}
type message_struct = {
  message_id: uint64;
  ideas_id: uint64;
  message: string;
  sender: string;
}
// type message_read_struct = {
//   message_id: uint64;
//   ideas_id: uint64;
//   wallet: string;
//   msg_type: string;
// }
type reply_struct = {
  reply_id: uint64;
  message_id: uint64;
  ideas_id: uint64;
  message: string;
}
// type UnbondingRequest = {
//   completionTime: uint64;
//   amount: uint64;
// }
type join_struct = {
  daoid: uint64;
  wallet: string;
}

class Granddao extends Contract {
  _dao_ids = GlobalStateKey<uint64>({ key: "_dao_ids" });
  _donations_ids = GlobalStateKey<uint64>({ key: "_donations_ids" });
  _goal_ids = GlobalStateKey<uint64>({ key: "_goal_ids" });
  _ideas_ids = GlobalStateKey<uint64>({ key: "_ideas_ids" });
  _join_ids = GlobalStateKey<uint64>({ key: "_join_ids" });
  // // _smart_contract_ids = GlobalStateKey<uint64>({ key: "_smart_contract_ids" });
  _ideas_vote_ids = GlobalStateKey<uint64>({ key: "_ideas_vote_ids" });
  _message_ids = GlobalStateKey<uint64>({ key: "_message_ids" });
  // // _message_read_ids = GlobalStateKey<uint64>({ key: "_message_read_ids" });
  _reply_ids = GlobalStateKey<uint64>({ key: "_reply_ids" });

  _dao_uris = BoxMap<bytes, dao_uri_struct>({ prefix: "_dao_uris" });  //_dao_ids              => (Dao)                    Dao Wallet + Dao URI   + Finished
  _template_uris = BoxMap<bytes, string>({ prefix: "_template_uris" });  //_dao_ids              => (Dao)                   Template HTML Code
  _joined_person = BoxMap<bytes, join_struct>({ prefix: "_joined_person" });  //_join_ids             => (Dao)                  join_struct

  _goal_uris = BoxMap<bytes, goal_uri_struct>({ prefix: "_goal_uris" });  //_goal_ids             => (Goal)                   Dao ID + Goal URI
  _ideas_uris = BoxMap<bytes, ideas_uri_struct>({ prefix: "_ideas_uris" });  //_ideas_ids            => (Ideas)                  Goal ID + Ideas URI
  // _donated = GlobalStateMap<string, uint64>({ maxKeys: 10, prefix: "_donated/" });  //string            => (Donated to ideas)                amount
  _donations = BoxMap<bytes, donation_struct>({ prefix: "_donations" });  //uint64            => donation_struct

  all_ideas_votes = BoxMap<bytes, goal_ideas_votes_struct>({ prefix: "all_ideas_votes" });  //_ideas_vote_ids       => (Vote)                   Goal ID + Ideas ID + Wallet

  all_messages = BoxMap<bytes, message_struct>({ prefix: "all_messages" });  // all_messages        => _message_ids + message_struct

  // all_read_messages = GlobalStateMap<uint64, message_read_struct>({ maxKeys: 10, prefix: "all_read_messages" });  // all_read_messages        => _message_read_ids + message_read_struct

  all_replies = BoxMap<bytes, reply_struct>({  prefix: "all_replies" });  // all_messages        => _reply_ids + reply_struct


  // eslint-disable-next-line no-unused-vars
  pay(boxMBRPayment: PayTxn): void {
  }



  //Dao
  createDao(boxMBRPayment: PayTxn, _dao_id: bytes, _dao_wallet: string, _dao_uri: string, _template: string): uint64 {
    this._dao_uris(_dao_id).value = { dao_wallet: _dao_wallet, dao_uri: _dao_uri, finished: 'False' };
    this._template_uris(_dao_id).value = _template;

    this._dao_ids.value = this._dao_ids.value + 1;
    return this._dao_ids.value;
  }

  updateTemplate(boxMBRPayment: PayTxn, _dao_id: bytes, _template: string): string {
    this._template_uris(_dao_id).value = _template;
    return "Ok";
  }

  // setDao(_dao_id: uint64, _dao_wallet: string, _dao_uri: string): string {
  //   let oldValue = this._dao_uris(_dao_id).value;
  //   oldValue.dao_uri = _dao_uri;
  //   oldValue.dao_wallet = _dao_wallet;

  //   this._dao_uris(_dao_id).value = oldValue;

  //   return "Ok";
  // }



  //Goal
  createGoal(boxMBRPayment: PayTxn, _goal_id: bytes, _goal_uri: string, _dao_id: uint64): uint64 {
    this._goal_uris(_goal_id).value = {
      dao_id: _dao_id,
      goal_uri: _goal_uri
    };

    this._goal_ids.value = this._goal_ids.value + 1;
    return this._goal_ids.value;
  }


  // setGoal(_goal_id: bytes, _goal_uri: string): string {
  //   let oldValue = this._goal_uris(_goal_id).value;
  //   oldValue.goal_uri = _goal_uri;

  //   this._goal_uris(_goal_id).value = oldValue;

  //   return "Ok";
  // }


  //Ideas
  createIdeas(boxMBRPayment: PayTxn, _ideas_id: bytes, _ideas_uri: string, _goal_id: uint64): uint64 {
    this._ideas_uris(_ideas_id).value = {
      goal_id: _goal_id,
      ideas_uri: _ideas_uri,
      donation: 0
    };

    this._ideas_ids.value = this._ideas_ids.value + 1;
    return this._ideas_ids.value;
  }


  createIdeasVote(boxMBRPayment: PayTxn, _ideas_votes_id: bytes, _goal_id: uint64, _ideas_id: uint64, _wallet: string): uint64 {
    this.all_ideas_votes(_ideas_votes_id).value = {
      goal_id: _goal_id,
      ideas_id: _ideas_id,
      wallet: _wallet
    };

    this._ideas_vote_ids.value = this._ideas_vote_ids.value + 1;
    return this._ideas_vote_ids.value;
  }

  //Messages
  sendMsg(boxMBRPayment: PayTxn, _message_id: bytes, _ideas_id: uint64, _message: string, _sender: string): uint64 {
    //Create messsage into all_messages
    this.all_messages(_message_id).value = {
      message_id: this._message_ids.value, ideas_id: _ideas_id, message: _message, sender: _sender
    };
    this._message_ids.value = this._message_ids.value + 1;

    return this._message_ids.value;
  }

  sendReply(boxMBRPayment: PayTxn, _reply_id: bytes, _message_id: uint64, _reply: string, ideas_id: uint64): uint64 {
    //Create messsage into all_messages
    this.all_replies(_reply_id).value = {
      reply_id: this._reply_ids.value, message_id: _message_id, message:_reply, ideas_id: ideas_id
    };
    this._reply_ids.value = this._reply_ids.value + 1;

    return this._reply_ids.value;
  }

  addDonation(boxMBRPayment: PayTxn,_donation_id: bytes, _ideas_id: bytes, _ideas_id_int: uint64, _doantion: uint64, _donator: string): void {

    this._ideas_uris(_ideas_id).value.donation + _doantion;

    this._donations(_donation_id).value ={
      ideas_id:_ideas_id_int,
      wallet:_donator,
      donation:_doantion
    };
    this._donations_ids.value = this._donations_ids.value + 1;


  }

  joinCommunity(boxMBRPayment: PayTxn,_join_id: bytes,dao_id: uint64, person: string): uint64 {
    this._joined_person(_join_id).value = { daoid: dao_id,  wallet: person};

    this._join_ids.value = this._join_ids.value + 1;
    return this._join_ids.value;
  }

}
