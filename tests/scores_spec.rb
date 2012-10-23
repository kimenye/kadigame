require 'rspec-expectations'
require 'rack/test'
require_relative '../app/scores'

describe 'Scores API' do

  let(:service) { ScoreService.new }

  before(:all) do
    service.delete_user("test")
  end

  it "creates a user that does not exist" do
    result = service.create_user(username="test")
    result.should == true
  end

  it "does not get a user who doesn't exist'" do
    test_user = service.get_user(username="does_not_exist")
    test_user.should be_nil
  end

  it "gets a test user from the service" do
    test_user = service.get_user(username="test")
    test_user.should_not be_nil
    test_user["username"].should eq("test")
  end

  it "lists all the users present" do
    test_users = service.get_users
    test_users.should_not be_nil
    test_users.length.should > 0
  end


  it "doest not delete a user that exists" do
    result = service.delete_user(username="does not exist")
    result.should == false
  end

  it "deletes a user that exists" do
    result = service.delete_user(username="test")
    result.should == true
  end
end