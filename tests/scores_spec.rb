require 'rspec-expectations'
require 'rack/test'
require_relative '../app/scores'

describe 'Scores API' do

  let(:service) { ScoreService.new("c4416a7f3717a7787e6cb7c291b5d6f5977146ab", "GpSVZEbhd") }

  before(:all) do
    service.delete_user("test")
  end

  after(:all) do
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

  it "creates a score for a user" do
    result = service.create_score("test", 5);
    result.should == true

    result = service.create_score("test", -2);
    result.should == true
  end

  it "calculates the correct score for a user" do
    user = service.create_user(username="test2")
    service.create_score("test2", 10)
    service.create_score("test2", -5)

    score = service.calculate_score("test2")
    score.should == 5

    service.delete_user(username="test2")
  end

  it "calculates the score for a user with no scores as zero" do
    user = service.create_user(username="test3")
    score = service.calculate_score("test3")
    score.should == 0

    service.delete_user(username="test3")
  end

  it "does not delete a user that exists" do
    result = service.delete_user(username="does not exist")
    result.should == false
  end

  it "deletes a user that exists" do
    result = service.delete_user(username="test")
    result.should == true
  end
end